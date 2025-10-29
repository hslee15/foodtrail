const express=require('express')
const router=express.Router()
const Post=require('../models/Posts') // 'Posts.js' (복수형) 사용
const jwt=require('jsonwebtoken')
const {presignGet}=require('../src/s3')
const mongoose=require('mongoose')

const authenticateToken = (req, res, next) => {

    let token = null;

    const h = req.headers.authorization;
    
    // h가 존재하고 'bearer'로 시작하는지 확인
    if (h && h.toLowerCase().startsWith('bearer')) {
        token = h.slice(7).trim()
    }

    if (req.cookies?.token) {
        token = req.cookies.token
    }

    
    if (!token) return res.status(401).json({ message: '토큰이 없습니다.' })

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET)
        next()
    } catch (error) {
        return res.status(403).json({ message: '유효하지 않은 토큰입니다.' })
    }

}

// 💡 400 에러 수정: ObjectId 검사 -> 숫자 검사
// const ensureObjectId=(req, res, next)=>{
//     if(!mongoose.Types.ObjectId.isValid(req.params.id)){
//         return res.status(400).json({message:'잘못된 id 형식입니다.'})
//     }
//     next()
// }

// 💡 400 에러 수정을 위한 새 미들웨어: 숫자인지 검사
const ensureValidNumber = (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id < 1) {
        // '1' 대신 'id' 파라미터가 유효하지 않다고 메시지 수정
        return res.status(400).json({ message: '유효하지 않은 id 형식입니다.' });
    }
    // req.params.id를 숫자로 변환하여 다음 핸들러에 전달 (선택 사항이지만 유용함)
    req.postIdAsNumber = id;
    next();
};


const pickDefined = (obj) => 
    Object.fromEntries(
        Object.entries(obj)
            .filter(([, v]) => v !== undefined)
    )

router.post('/',authenticateToken,async(req,res, next)=>{ // next 추가
    try {
        let { title, content, fileUrl = [], imageUrl } = req.body // fileUrl let으로 변경

        if(typeof fileUrl==='string'){
            try {
                fileUrl=JSON.parse(fileUrl)
            } catch (error) {
                fileUrl=[fileUrl]
            }
        }

        const latest=await Post.findOne().sort({number:-1})

        const nextNumber=latest? latest.number +1: 1

        const post=await Post.create({
            user:req.user._id || req.user.id,
            number :nextNumber,
            title,
            content,
            fileUrl,
            imageUrl
        })

        res.status(201).json(post) // 501 -> 201 (Created)

    } catch (error) {
        console.error('POST /api/posts 실패:', error)
        next(error); // 공통 에러 핸들러로 전달
    }
})

router.get('/',async(req,res, next)=>{ // next 추가
    try {
        const list=await Post.find().sort({createdAt:-1}).lean()

        const data=await Promise.all(
            list.map(async(p)=>{
                const arr=Array.isArray(p.fileUrl)?
                p.fileUrl : (p.imageUrl? [p.imageUrl]:[])

                const urls=await Promise.all(
                    // v가 존재할 때만 presignGet 호출
                    arr.filter(v => v).map(async(v)=> (v?.startsWith("http")? v: await presignGet(v,3600)))
                )

                return {...p,fileUrl:urls}
            })
        )

        res.json(data)
    } catch (error) {
        console.error('GET /api/posts 실패',error)
        next(error); // 공통 에러 핸들러로 전달
    }
})

router.get('/my',authenticateToken, async(req,res, next)=>{ // next 추가
    try {
        
        const userId=req.user._id || req.user.id
        if(!userId) return res.status(400).json({message:'유저 정보 없음'})

        const myPosts=await Post.find({user:userId}).sort({createdAt:-1}).lean()

        res.json(myPosts)
    } catch (error) {
        console.error('GET /api/posts/my 실패',error)
        next(error); // 공통 에러 핸들러로 전달
    }
})

// 💡 400 에러 수정: ensureObjectId -> ensureValidNumber, findById -> findOne({ number: ... })
router.get('/:id', ensureValidNumber, async(req, res, next)=>{
    try {
        
        // const doc = await Post.findById(req.params.id).lean() // 몽고 _id로 찾음
        const doc = await Post.findOne({ number: req.params.id }).lean() // 'number' 필드로 찾음

        if(!doc) return res.status(404).json({message:'존재하지 않는 게시글'})
        
        // (S3 URL 변환 로직이 필요하면 여기에도 추가해야 합니다)

        res.json(doc)

    } catch (error) {
        console.error(`GET /api/posts/${req.params.id} 실패`, error);
        next(error); // 공통 에러 핸들러로 전달
    }
})

// 💡 400 에러 수정: ensureObjectId -> ensureValidNumber, findByIdAndUpdate -> findOneAndUpdate({ number: ... })
router.put('/:id', authenticateToken, ensureValidNumber, async(req, res, next)=>{
    try {
        const {title, content, fileUrl, imageUrl}=req.body


        const updates = pickDefined({
            title, 
            content, 
            fileUrl, 
            imageUrl
        })

        const updated = await Post.findOneAndUpdate(
            { number: req.params.id }, // _id 대신 'number' 필드로 찾음
            {$set:updates},
            {new:true,runValidators:true}
        )

        if(!updated) return res.status(404).json({message:'존재하지 않는 게시글'})

        res.json(updated)

    } catch (error) {
        console.error(`PUT /api/posts/${req.params.id} 실패`, error);
        next(error); // 공통 에러 핸들러로 전달
    }
})

// 💡 400 에러 수정: ensureObjectId -> ensureValidNumber, findByIdAndDelete -> findOneAndDelete({ number: ... })
router.delete('/:id', authenticateToken, ensureValidNumber, async(req, res, next)=>{
    try {
        // const deleted=await Post.findByIdAndDelete(req.params.id)
        const deleted=await Post.findOneAndDelete({ number: req.params.id }) // _id 대신 'number' 필드로 찾음

        if(!deleted) return res.status(404).json({message:'존재하지 않는 게시글'})

        res.json({ok:true, id:deleted._id}) // 삭제된 몽고 _id 반환

    } catch (error) {
        console.error(`DELETE /api/posts/${req.params.id} 실패`, error);
        next(error); // 공통 에러 핸들러로 전달
    }
})

module.exports=router

