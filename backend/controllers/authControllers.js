const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")

let refreshTokens = [];
const authController = {
    registerUser: async(req,res)=>{
       
        try {
            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(req.body.password,salt);
          
            //create new user
            const newUser = await new User({
                userName: req.body.userName,
                email: req.body.email,
                password: hashed,
            })

            //save to db

            const user = await newUser.save();
            res.status(201).json(user)
        } catch (err) {
            res.status(500).json(err);
        }
    },

    generateAccessToken: (user)=>{
        return jwt.sign(
            {
                id:user.id,
                admin:user.admin
            },
            process.env.JWT_ACCESS_KEY,
            {expiresIn:"30s"}

        )
    },
    generateRefreshToken: (user)=>{
        return jwt.sign(
            {
                id:user.id,
                admin:user.admin
            },
            process.env.JWT_ACCESS_KEY,
            {expiresIn:"365d"}

        )
    },
    
    loginUser: async(req,res)=>{
        try {
            const user = await User.findOne({userName: req.body.userName});
            if(!user){
                res.status(404).json("Wrong username!")
            }

            const vaildPassword = await bcrypt.compare(
                req.body.password,
                user.password
            )

            if(!vaildPassword){
                res.status(404).json("Wrong password")
               
            }
            if(user && vaildPassword){
                const accessToken = authController.generateAccessToken(user);
                const refreshToken = authController.generateRefreshToken(user);
                refreshTokens.push(refreshToken);
                res.cookie("refreshToken",refreshToken,{
                    httpOnly:true,
                    secure:false,
                    path:"/",
                    sameSite:"strict",
                })
                const {password, ...others}= user._doc;
                res.status(200).json({...others,accessToken});
            }
        } catch (err) {
            res.status(500).json(err);
        }
    },
    requestRefeshToken: async(req,res)=>{
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return res.status(401).json("You're not authenticated");
       
        if(!refreshTokens.includes(refreshToken)){
            return res.status(403).json("Refresh token is not valid");
        }
    
        jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY, (err,user)=>{
            console.log(user)
            if(err){
                console.log(err)
            }
            refreshTokens = refreshTokens.filter((token)=>token !== refreshToken);
            const newAccessToken = authController.generateAccessToken(user);
            const newRefreshToken = authController.generateRefreshToken(user);
            refreshTokens.push(newRefreshToken);
            res.cookie("refreshToken",newRefreshToken,{
                httpOnly:true,
                secure:false,
                path:"/",
                sameSite:"strict",
            })
            res.status(200).json({accessToken: newAccessToken})
        })
    },
    //logout
    userLogout:async(req,res)=>{
        res.clearCookie("refreshToken");
        refreshTokens = refreshTokens.filter(token => token !== req.cookies.refreshToken);
        res.status(200).json("Logged out!")
    }

}
module.exports = authController;
