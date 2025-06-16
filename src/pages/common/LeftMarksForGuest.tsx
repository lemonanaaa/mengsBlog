import React from "react";
import { useLocation } from 'react-router-dom';
import "../../css/common/leftMark.css";

const LeftMarksForGuest = () => {
    const location = useLocation();

    return (
        <div className="left-marks">
            {/* 图片部分 */}
            <div className="img-box">11111</div>
            {/* 介绍部分 */}
            <div className="desc-box">
                {/* 给外界看的，修好的图 */}
                <div>介绍</div>
                {/* TODO 写一个广告页面，区分普通版本是看不到的，只有售前客人才能看到 */}
                <div>接单明细</div>
                {/* 给客人们单独看自己的图片 */}
                <div>底片们</div>
                {/* 公开的一些策划，每次拍摄的时间，地点，任务，设备等记录 */}
                <div>Pictures with timeline</div>
            </div>
        </div>
    );
};

export default LeftMarksForGuest;
