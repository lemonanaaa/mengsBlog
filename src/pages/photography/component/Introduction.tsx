import React, { useContext } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../../common/Layout";
import { mengsBlogContext } from "../../common/Layout";
import { Typography, Tag } from "antd";
import { CrownOutlined, BookOutlined } from "@ant-design/icons";
import "../../../css/photography/uploadPhotos.css";

const { Title, Text, Paragraph } = Typography;

const Introduction = () => {
  const [searchParams] = useSearchParams();
  const { blogCommonStore } = useContext(mengsBlogContext) as any;
  
  // 检查是否为 Meng 模式
  const isMeng = searchParams.get('meng') === 'true';

  return (
    <Layout>
      <div className="photography-introduction photo-management">
        {/* 页面标题 */}
        <div className="page-header">
          <Title level={2}>
            <BookOutlined /> 摄影师萌简介
          </Title>
          {isMeng && (
            <Tag color="purple" icon={<CrownOutlined />} style={{ marginLeft: 12 }}>
              meng模式
            </Tag>
          )}
        </div>

        {/* 摄影师介绍内容 */}
        <div className="introduction-content">
          <div className="profile-section">
            <Title level={3}>关于我</Title>
            <Paragraph>
              我是一名专业的人像摄影师，拥有多年的拍摄经验。专注于人像摄影、婚纱摄影、商业摄影等领域。
              我相信每个人都有自己独特的美，我的使命就是通过镜头捕捉这些美好瞬间，让每个人都能看到自己最美丽的一面。
            </Paragraph>
          </div>

          <div className="skills-section">
            <Title level={3}>专业技能</Title>
            <ul>
              <li>人像摄影：专业人像拍摄，突出人物特点</li>
              <li>婚纱摄影：浪漫唯美的婚纱照拍摄</li>
              <li>商业摄影：产品摄影、企业形象摄影</li>
              <li>后期处理：专业的照片后期调色和修图</li>
              <li>场景布置：根据主题设计拍摄场景</li>
            </ul>
          </div>

          <div className="equipment-section">
            <Title level={3}>拍摄设备</Title>
            <ul>
              <li>相机：Canon EOS R5、Canon EOS 5D Mark IV</li>
              <li>镜头：24-70mm f/2.8、85mm f/1.4、70-200mm f/2.8</li>
              <li>灯光：专业摄影棚灯光设备</li>
              <li>配件：三脚架、反光板、柔光箱等</li>
            </ul>
          </div>

          <div className="services-section">
            <Title level={3}>服务项目</Title>
            <ul>
              <li>个人写真：展现个人魅力的专业写真</li>
              <li>情侣摄影：记录甜蜜时光的情侣照</li>
              <li>婚纱摄影：浪漫唯美的婚纱照</li>
              <li>家庭摄影：温馨和谐的家庭照</li>
              <li>商业摄影：企业形象、产品展示等</li>
            </ul>
          </div>

          {isMeng && (
            <div className="meng-mode-section">
              <Title level={3}>管理功能</Title>
              <Paragraph>
                在meng模式下，你可以：
              </Paragraph>
              <ul>
                <li>管理所有拍摄批次和照片</li>
                <li>上传新的拍摄作品</li>
                <li>查看完整的照片库</li>
                <li>管理客户信息和拍摄记录</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Introduction;