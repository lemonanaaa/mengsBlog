import React, { useState, useMemo, useContext } from "react";
import { Image } from 'antd';
import { useLocation } from 'react-router-dom';
import { mengsBlogContext } from "../common/Layout.tsx";

import mengsPhoto from "../../assets/mengsPhoto.jpg";

import "../../css/common/leftMark.css";


const LeftMarks = () => {

  const location = useLocation();
  const { blogCommonStore, setBlogCommonStore } = useContext(mengsBlogContext);
  console.log('leftMarks中的blogCommonStore====>', blogCommonStore)

  return (
    <div className="left-marks">
      {/* 图片部分 */}
      <div className="img-box">
        <Image src={mengsPhoto} style={{ width: '120px' }}></Image>
        {/* TODO 加一下联系方式和链接 */}
      </div>
      {/* 介绍部分 */}
      <div className="desc-box">
        {/* 首页 */}
        <a href="/">Meng's home</a>
        {/* 前端工作介绍 */}
        <a href="/career">前端Meng</a>
        {(location.pathname.startsWith('/career') || location.pathname === '/') && (
          <>
            <div onClick={() => { window.location.href = '/career/resume' }}>简历页面</div>
            <div onClick={() => {
              window.location.href = '/career/haslearned'
              setBlogCommonStore({ 'showComponent': 'blogs' })
            }}>前端知识树</div>
            <div onClick={() => {
              window.location.href = '/career/haslearned'
              setBlogCommonStore({ 'showComponent': 'blogsWithTimeline' })
            }}>Blogs with timeLine</div>
          </>
        )}
        {/* 算法工作介绍 */}
        {false && <a href="/algorithm">算法Meng</a>}
        {/* 摄影介绍 */}
        <a href="/photography" >摄影师Meng</a>
        {(location.pathname === '/photography') && (
          <>
            {/* 给外界看的，修好的图 */}
            <div onClick={() => { setBlogCommonStore({ 'showComponent': 'introduction' }) }}>介绍</div>
            {/* 给客人们单独看自己的图片 */}
            <div onClick={() => { setBlogCommonStore({ 'showComponent': 'pictures' }) }}>底片们</div>
            {/* 公开的一些策划，每次拍摄的时间，地点，任务，设备等记录 */}
            <div onClick={() => { setBlogCommonStore({ 'showComponent': 'timeline' }) }}>Pictures with timeline</div>
          </>
        )}

        {/* 个人日记等 */}
        <a href="/writing">Meng‘s碎碎念</a>
      </div>
    </div>

  );
};

export default LeftMarks;
