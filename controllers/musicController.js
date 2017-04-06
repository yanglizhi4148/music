/**
 * Created by 琴瑟 on 2017/3/29.
 */
'use strict';
const formidable=require('formidable');//引入解析文件对象
const config=require('../config');
const path=require('path');//核心对象
const MongoClient=require('mongodb').MongoClient;
const url = 'mongodb://' + config.db_host + ':' + config.db_port + '/' + config.db_database;
const ObjectID=require('mongodb').ObjectID;
const querystring=require('querystring');

/**
 * 显示添加音乐
 * @param req
 * @param res
 * @param next
 */
exports.showAddMusic=(req,res,next)=>{
    res.render('add');
};

/**
 * 上传文件
 * @param req
 * @param res
 * @param next
 */
exports.doUpload=(req,res,next)=>{
    var form=new formidable.IncomingForm();
    form.uploadDir=config.appRootPath+'/public/files';
    form.parse(req,function(err,fields,files){
        if(err) return next(err);

        //1.获取数据
        let qObj=querystring.parse(fields.data);
        let title=qObj.title;
        let time=qObj.time;
        let singer=qObj.singer;
        let musicSrc='/public/files/'+path.parse(files.file.path).base;//音乐src
        let lrcSrc='/public/files/'+path.parse(files.filelrc.path).base;//歌词src
        let uid=req.session.user._id;
        //2.存储数据
        MongoClient.connect(url,function(err,db){
            //获取集合对象
            let musicCollection=db.collection('musics');
            musicCollection.insertMany([{
                title,
                time,
                singer,
                musicSrc,
                lrcSrc,
                uid
            }],(err,result)=>{
                if(err) return next(err);

                //响应
                //3.1同步方式响应页面
                //res.render('index');//过去听歌
                //3.2异步方式响应
                //响应一个json对象
                res.json({
                    code:'001',
                    msg:'哈哈你ok了'
                });
            });
        });
    });
};

exports.showEditMusic=(req,res,next)=>{
    //接收数据
    let _id;
    try{
        _id=ObjectID(req.query.mid);
    }  catch(e){

    }
    //操作数据
    MongoClient.connect(url,function(err,db){
        //获取集合对象
        let musicCollection=db.collection('musics');
        musicCollection.find({_id}).toArray(function(err,musics){
            if(err) return next(err);
            if(musics.length===0){
                return res.render('info',{msg:'歌曲没有找到'});
            }
            let music=musics[0];//使用ObjectID唯一标识查询要么有1条数据，要么没有数据
            music._id=music._id+'';//转换成字符串便于显示
            //3.响应
            res.render('edit',{music});
        });
    });
};


exports.editUpload=(req,res,next)=>{
    var form=new formidable.IncomingForm();
    form.uploadDir=config.appRootPath+'/public/files';
    form.parse(req,function(err,fields,files){
        if(err) return next(err);
        let qObj=querystring.parse(fields.data);
        let title=qObj.title;
        let time=qObj.time;
        let singer=qObj.singer;
        //由于需要更新，我们需要获取到歌曲的id作为条件
        let _id=ObjectID(qObj._id);
        //封装成一个对象
        let updateObj={
            title,
            time,
            singer
        };
        if(files.file){
            updateObj.musicSrc='/public/files/'+path.parse(files.file.path).base;
        }
        if(files.filelrc){
            updateObj.lrcSrc='/public/files/'+path.parse(files.filelrc.path).base;
        }
        let uid=req.session.user._id;
        //2.存储数据
        MongoClient.connect(url,function(err,db){
            //获取集合对象
            let musicCollection=db.collection('musics');
            //执行更新操作
            musicCollection.updateMany({_id},{
                $set:updateObj
            },function(err,result){
                if(err) return next(err);
                res.json({code:'001'});
            });
        });
    });
} ;

/**
 * 删除音乐
 * @param req
 * @param res
 * @param next
 */
exports.deleteMusic=(req,res,next)=>{
    let _id;
    try{
        _id=ObjectID(req.params.mid);
    }catch(e){

    }
    //删除内容
    MongoClient.connect(url,function(err,db){
        //获取集合对象
        let musicCollection=db.collection('musics');
        //执行更新操作
        musicCollection.deleteMany({_id},function(err,result){
            if(err) return next(err);
            //res.json({code:'001'});
            if(result.deletedCount===0){
                res.json({code:'002',msg:'删除失败'})
            }else{
                res.json({code:'001',msg:'删除成功'})
            }
        });
    });
};