import React from "react";
import { Image } from 'antd';

import mengsPhoto from "../../assets/mengsPhoto.jpg";

import "../../css/common/leftMark.css";


const LeftMarks = () => {

  return (
    <div className="left-marks">
      {/* 图片部分 */}
      <div className="img-box">
        <Image src={mengsPhoto} style={{ width: '120px' }}></Image>
      </div>
      {/* 介绍部分 */}
      <div className="desc-box">
        {/* 工作介绍 */}
        <a href="/career/resume">前端Meng</a>
        {/* 摄影介绍 */}
        <a href="/photography">摄影师Meng</a>
        {/* 个人日记等 */}
        <a href="/writing">Meng‘s碎碎念</a>
      </div>
    </div>
  );
};

export default LeftMarks;
