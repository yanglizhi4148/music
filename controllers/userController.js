/**
 * Created by 琴瑟 on 2017/3/26.
 */
'use strict';
const config=require('../config');
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://' + config.db_host + ':' + config.db_port + '/' + config.db_database;
const captchapng=require('captchapng');

module.exports.findUser=(obj,callback)=>{
    MongoClient.connect(url,function(err,db){
        console.log('数据库连接成功');
        //获取集合对象
        let userCollection=db.collection('users');
        userCollection.find(obj).toArray(function(err,users){
            db.close();//关闭连接
            callback(err,users);//不去处理异常，有:外部来处理
        });
    });
};
//let obj={
//    showRegister
//};
//module.exports=obj

//module.exports默认是导出一个空对象，如果你赋值，也是
//拿到module.exports这个对象
module.exports.showRegister=function(req,res,next){
    //接收数据
    let name=req.query.name;//register?name=jack
    //操作数据
    //使用name作为条件查询数据
    module.exports.findUser({name},function(err,users){
        if(err) return next(err);
        res.render('register');
    });
};
module .exports.checkUserName=(req,res,next)=>{
    let username=req.body.username;
    module.exports.findUser({username},function(err,users){
        if(err) return next(err);
        if(users.length!=0){
            res.json({code:'001',msg:'用户名已经存在!'});
        }else{
            res.json({code:'002',msg:'恭喜可以注册!'});
        }
    });
};

/**
 * 处理注册
 * @param req
 * @param res
 * @param next
 */
module .exports.doRegister=(req,res,next)=>{
    //获取请求数据post
    let username=req.body.username;
    let email=req.body.email;
    let password=req.body.password;
    let vcode=req.body.vcode;

    //获取vcode
    let sessionVcode=req.session.vcode;
    if(vcode!=sessionVcode){
        return res.join({code:'003',msg:'验证码错误'});
    }

    //判断vcode

    //判断用户名是否存在
    MongoClient.connect(url,function(err,db){
        if(err) return next(err);
        let userCollection=db.collection('users');
        userCollection.find({username}).toArray(function(err,users){
            if(err) return next(err);
            if(users.length!=0){
                db.close();
                return res.json({code:'002',msg:'用户名已经存在'});
            }
            //没有用户，保存该用户数据
            userCollection.insertMany([{
                username,
                email,
                password
            }],function(err,result){
                if(err) next(err);
                if(result.insertedCount===1){
                    res.json({code:'001',msg:'恭喜注册成功!'});
                }
                db.close();//关闭连接
            });
        });
    });
};

/**
 * 处理登录页面
 * @param req
 * @param res
 * @param next
 */
module.exports.showLogin=(req,res,next)=>{
    let username='';
    let checked='';
    //操作原生cookie
    //if(typeof req.headers['cookie']!='undefined'){
    //    let qs=require('querystring');
    //    let username=qs.parse(req.headers['cookie']).username;
    //}

    //使用cookie-parser
    if(typeof req.cookies.username!= 'undefined' ){
        console.log('进来了吗');
        username=req.cookies.username;
        checked='checked';
    }
    res.render('login',{username,checked});
};

/**
 * 处理登录
 * @param req
 * @param res
 * @param next
 */
module.exports.doLogin=(req,res,next)=>{
    //1.接收参数post
    let username=req.body.username;
    let password=req.body.password;
    let rememberme=req.body.rememberme;//这个值有可能是undefined


    //2.通过userName查询数据库，判断该用户是否存在
    module.exports.findUser({username},function(err,users){
        if(err) next(err);
        if(users.length===0){//用户名不存在
            return res.render('login',{msg:'用户名或密码不正确'});
        }
        let user=users[0];//注册的口碑我们阻塞了，不可能同时出现同一个用户名
        //多个用户的情况，所以此时直接取第一个元素就ok

        //3.如果用户名存在 比较密码
        if(password!=user.password){
            return res.render('login',{msg:'用户名或密码不正确'});
        }

        //根据用户是否勾选记住我，向服务器写cookie
        let time=1000*60*60*24*7;
        if(typeof rememberme ==='undefined'){
            time=-1;//清除cookie
        }
        res.cookie('username',username,{
            maxAge:time//记住我一周
        });

        //如果可以登录，把数据放入到session中
        req.session.user=user;

        //如果以上反向判断都不满足，说明密码正确，跳转到首页
        res.redirect('/index');
    });
};

/**
 *显示首页
 * @param req
 * @param res
 * @param next
 */
module.exports.showIndex=(req,res,next)=>{
    let _id;
    //使用该用户当前的session
    let user=req.session.user;

    //查询数据,根据当前登陆人的id查询相关的音乐歌曲
    let uid=req.session.user._id;
    //根据这个ID去查询uid=这个id的所有歌曲
    MongoClient.connect(url,function(err,db){
        //获取集合对象
        let musicsCollection=db.collection('musics');
        musicsCollection.find({uid}).toArray(function(err,musics){
            if(err) return next(err);
            //由于是数字类型，在页面遍历的时候导致art-template无法输出出来
            for(var i=musics.length-1;i>=0;i--){
                musics[i]._id=musics[i]._id+'';
            }
            //该操作结束
            res.render('index',{user,musics});
            db.close();//关闭连接
        })
    });

};

/**
 * 退出
 * @param req
 * @param res
 * @param next
 */
exports.logout=(req,res,next)=>{
    req.session.user=null;//清除session中的状态
    res.redirect('/login');
};

/**
 * 响应验证码并将答案挂载到session上
 * @param req
 * @param res
 * @param next
 */
exports.getCaptchaPng=(req,res,next)=>{
    var num=parseInt(Math.random()*9000+1000);
    var p = new captchapng(80,30,num); // width,height,numeric captcha
    p.color(0, 0, 0, 0);  // First color: background (red, green, blue, alpha)
    p.color(80, 80, 80, 255); // Second color: paint (red, green, blue, alpha)

    var img = p.getBase64();
    var imgbase64 = new Buffer(img,'base64');
    res.writeHead(200, {
        'Content-Type': 'image/png'
    });
    //挂载答案到session上
    req.session.vcode=num;
    res.end(imgbase64);
};
