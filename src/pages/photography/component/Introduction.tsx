import React from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../../common/Layout";
import { Typography, Tag } from "antd";
import { CrownOutlined, CameraOutlined } from "@ant-design/icons";
import "../../../css/photography/uploadPhotos.css";
import "../../../css/photography/photographyMain.css";

const { Title } = Typography;

const Introduction = () => {
  const [searchParams] = useSearchParams();
  const isMeng = searchParams.get("meng") === "true";

  return (
    <Layout>
      <div className="photography-introduction photo-management">
        <div className="page-header">
          <Title level={2}>
            <CameraOutlined /> 摄影 Meng
          </Title>
          {isMeng && (
            <Tag color="purple" icon={<CrownOutlined />} style={{ marginLeft: 12 }}>
              meng模式
            </Tag>
          )}
        </div>

        <div className="photography-wip">
          <h3 className="photography-wip-title">页面建设中</h3>
          <p className="photography-wip-desc">正在解决大照片存储问题，敬请期待</p>
        </div>
      </div>
    </Layout>
  );
};

export default Introduction;
