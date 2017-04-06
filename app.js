/**
 * Created by 琴瑟 on 2017/3/26.
 */
'use strict';
const express=require('express');
const template=require('art-template');
const bodyParser=require('body-parser');
const router=require('./router.js');
const session=require('express-session');//处理session
const cookieParser = require('cookie-parser');//解析cookie

let app=express();
//配置模板开始
template.config('cache',false);
app.set('views','./views');
app.engine('html',template.__express);
app.set('view engine','html');
//模板结束

//解析body数据
app.use(bodyParser.urlencoded({extended:false}));
//解析静态资源文件
app.use('/public',express.static('public'));
//添加session的处理
app.use(session({
    secret: 'itcast',//唯一标识一下
    resave: false,//当某个用户的session没有发生改变，不用再次重复保存
    saveUninitialized: true//一访问就存在session
    //cookie: { secure: true } 设置cookie中只有在https下有效
}));
//放在路由前面，提前让req,具备解析cookie的属性
app.use(cookieParser());

//在路由判断以前，我统统判断一次，如果没有session进入到首页
app.use(function(req,res,next){
    if((req.url==='/'
        ||req.url==='/index'
        ||req.url==='/add'
        ||req.url.startsWith('/edit')
        ||req.url.startsWith('/del'))
        &&!req.session.user){
        res.redirect('login');
    }
    //如果是index或者/
    next();
});


app.use(router);

//处理异常
app.use(function(err,req,res,next){
    console.log('出异常了', err.stack);
    next();
});
app.listen(80,()=>{
    console.log('服务器启动了');
});