import React, { useContext } from "react";
import Layout from "../common/Layout.tsx";
import { mengsBlogContext } from "../common/Layout.tsx";
import Introduction from "./component/Introduction.tsx";
import Pictures from "./component/Pictures.tsx";
import Timeline from "./component/Timeline.tsx";


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
  const { blogCommonStore, setBlogCommonStore } = useContext(mengsBlogContext);


  const { showComponent } = blogCommonStore;
  return (
    <>
      {showComponent === 'introduction' && <Introduction />}
      {showComponent === 'pictures' && <Pictures />}
      {showComponent === 'timeline' && <Timeline />}

    </>
  )
}
