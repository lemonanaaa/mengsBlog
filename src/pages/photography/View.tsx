import React, { useContext } from "react";
import Layout from "../common/Layout";
import { mengsBlogContext } from "../common/Layout";
import Introduction from "./component/Introduction";
import Pictures from "./component/Pictures";
import Timeline from "./component/Timeline";


const Photography = () => {
  return <Layout>
    <TitleLine />
    <Components />
  </Layout>;
};

export default Photography;

const TitleLine = () => {
  return (<>
    <div>
      摄影师萌简介
    </div>

  </>)
}

const Components = () => {
  const { blogCommonStore, setBlogCommonStore } = useContext(mengsBlogContext) as any;


  const { showComponent } = blogCommonStore;
  return (
    <>
      {showComponent === 'introduction' && <Introduction />}
      {showComponent === 'pictures' && <Pictures />}
      {showComponent === 'timeline' && <Timeline />}

    </>
  )
}
