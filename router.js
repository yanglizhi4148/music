/**
 * Created by 琴瑟 on 2017/3/26.
 */
'use strict';
const express=require('express');
const userController=require('./controllers/userController');
const musicController=require('./controllers/musicController');

//操作路由
let router=express.Router();
//路由规则开始
router.get('/register', userController.showRegister)//显示注册
    .post('/check-user-name',userController.checkUserName)//检查用户名是否存在
    .post('/doRegister',userController.doRegister)//处理注册
    .get('/login',userController.showLogin)//显示注册页面
    .post('/do-login',userController.doLogin)//处理登录
    .get('/index',userController.showIndex)//显示首页
    .get('/logout',userController.logout)//退出
    .get('/getCaptchaPng',userController.getCaptchaPng)//获取验证码并加答案挂载到session上
    .get('/add',musicController.showAddMusic)//显示显示添加音乐页面
    .post('/upload',musicController.doUpload)//处理上传文件数据
    .get('/',userController.showIndex)//通过首页访问
    .get('/edit',musicController.showEditMusic)//显示编辑页面
    .post('/editUpload',musicController.editUpload)//更新歌曲数据
    .get('/del/:mid',musicController.deleteMusic)//删除音乐
//路由规则结束
module.exports=router;