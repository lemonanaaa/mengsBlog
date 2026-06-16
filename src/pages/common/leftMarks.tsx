import React, { useState, useMemo, useContext, useRef, useEffect } from "react";
import { Image } from 'antd';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { mengsBlogContext } from "../common/Layout";
import { createNavigateWithMeng } from "../../utils/navigation";

import mengsPhoto from "../../assets/mengsPhoto.jpg";

import "../../css/common/leftMark.css";

// 侧边栏配置接口
interface LeftMarksConfig {
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  collapsedWidth: number;
}

// 侧边栏状态接口
interface LeftMarksState {
  width: number;
  isCollapsed: boolean;
  previousWidth: number; // 收起前的宽度，用于恢复
}

// localStorage 存储管理类
export class LeftMarksStorage {
  private static readonly STORAGE_KEY = 'leftMarksState';
  
  // 获取存储的状态
  static getState(): LeftMarksState {
    try {
      const savedState = localStorage.getItem(this.STORAGE_KEY);
      if (savedState) {
        return JSON.parse(savedState);
      }
    } catch (error) {
      console.warn('Failed to parse leftMarks state from localStorage:', error);
    }
    
    // 返回默认状态
    return {
      width: 280,
      isCollapsed: false,
      previousWidth: 280
    };
  }
  
  // 保存状态
  static saveState(state: Partial<LeftMarksState>): void {
    try {
      const currentState = this.getState();
      const newState = { ...currentState, ...state };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.warn('Failed to save leftMarks state to localStorage:', error);
    }
  }
  
  // 获取收起前的宽度
  static getPreviousWidth(): number {
    try {
      const state = this.getState();
      return state.previousWidth;
    } catch (error) {
      console.warn('Failed to get previous width from state:', error);
      return 280;
    }
  }
  
  // 保存收起前的宽度
  static savePreviousWidth(width: number): void {
    try {
      const currentState = this.getState();
      this.saveState({ ...currentState, previousWidth: width });
    } catch (error) {
      console.warn('Failed to save previous width to state:', error);
    }
  }
  
  // 清除所有存储的数据
  static clear(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear leftMarks storage:', error);
    }
  }
}

const LeftMarks = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { blogCommonStore, setBlogCommonStore } = useContext(mengsBlogContext) as any;
  
  // 通用导航函数，自动保持meng参数
  const navigateWithMeng = createNavigateWithMeng(navigate, searchParams);
  
  // 侧边栏配置
  const config: LeftMarksConfig = {
    defaultWidth: 280,
    minWidth: 230,
    maxWidth: 500,
    collapsedWidth: 20
  };
  
  // 宽度拖拽相关状态
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(config.defaultWidth);
  const leftMarksRef = useRef<HTMLDivElement>(null);
  
  // 从存储获取初始状态
  const initialState = LeftMarksStorage.getState();
  const [isCollapsed, setIsCollapsed] = useState(initialState.isCollapsed);
  const [width, setWidth] = useState(initialState.width);

  // 确保组件初始化后正确应用样式
  useEffect(() => {
    console.log('LeftMarks initialized with:', { isCollapsed, width, initialState });
    
    // 如果初始状态是收起状态，确保宽度正确
    if (initialState.isCollapsed && width !== config.collapsedWidth) {
      setWidth(config.collapsedWidth);
      notifyWidthChange(config.collapsedWidth);
    }
    
    // 如果初始状态是展开状态，确保宽度正确
    if (!initialState.isCollapsed && width !== initialState.width) {
      setWidth(initialState.width);
      notifyWidthChange(initialState.width);
    }
    
    // 确保Layout组件知道当前宽度
    notifyWidthChange(width);
  }, []);

  // 通知 Layout 组件宽度变化
  const notifyWidthChange = (newWidth: number) => {
    window.dispatchEvent(new CustomEvent('leftMarksWidthChange', { 
      detail: { width: newWidth } 
    }));
  };

  // 收起/展开侧边栏
  const toggleCollapse = () => {
    // 如果正在拖拽，不执行收起/展开操作
    if (isResizing) {
      return;
    }
    
    const newCollapsed = !isCollapsed;
    
    if (newCollapsed) {
      // 收起时，保存当前宽度并设置为最小宽度
      LeftMarksStorage.savePreviousWidth(width);
      setWidth(config.collapsedWidth);
      setIsCollapsed(true); // 设置收起状态
      notifyWidthChange(config.collapsedWidth);
      LeftMarksStorage.saveState({ width: config.collapsedWidth, isCollapsed: newCollapsed });
    } else {
      // 展开时，恢复之前的宽度
      const restoredWidth = LeftMarksStorage.getPreviousWidth();
      setWidth(restoredWidth);
      setIsCollapsed(false); // 设置展开状态
      notifyWidthChange(restoredWidth);
      LeftMarksStorage.saveState({ width: restoredWidth, isCollapsed: newCollapsed });
    }
  };

  // 开始调整宽度
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startWidth = width;
    let currentWidth = width; // 用于跟踪当前宽度
    
    // 创建事件处理函数
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(config.minWidth, Math.min(config.maxWidth, startWidth + deltaX));
      currentWidth = newWidth; // 更新当前宽度
      setWidth(newWidth);
      // 实时通知 Layout 组件宽度变化
      notifyWidthChange(newWidth);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      // 拖拽结束时保存最终宽度到存储
      LeftMarksStorage.saveState({ width: currentWidth, isCollapsed: false });
      
      // 移除全局事件监听
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    // 添加全局事件监听
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 收起状态下显示一个向右箭头，整个区域可点击
  if (isCollapsed) {
    return (
      <div 
        className="left-marks-collapsed"
        onClick={toggleCollapse}
        title="点击展开侧边栏"
        style={{ width: `${config.collapsedWidth}px` }}
      >
        {/* 向右箭头 - 放在上方 */}
        <div className="collapse-arrow">
          ›
        </div>
      </div>
    );
  }

  // 展开状态下显示完整的侧边栏
  return (
    <div 
      ref={leftMarksRef}
      className="left-marks"
      style={{
        width: width
      }}
    >
      {/* 拖拽调整区域 */}
      <div
        className={`resize-handle ${isResizing ? 'resizing' : ''}`}
        onMouseDown={handleResizeStart}
        title="拖拽调整宽度"
      />

            {/* 收起按钮 */}
      <div
        className="collapse-button"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // 判断是点击还是拖拽
          let isDragging = false;
          let startX = e.clientX;
          let startWidth = width;
          
          const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - startX;
            if (Math.abs(deltaX) > 5) { // 如果移动超过5px，认为是拖拽
              isDragging = true;
              setIsResizing(true);
              
              const newWidth = Math.max(config.minWidth, Math.min(config.maxWidth, startWidth + deltaX));
              setWidth(newWidth);
              notifyWidthChange(newWidth);
            }
          };
          
          const handleMouseUp = (mouseUpEvent: MouseEvent) => {
            if (isDragging) {
              // 如果是拖拽，保存宽度
              setIsResizing(false);
              // 使用当前计算出的宽度，而不是可能未更新的state
              const finalWidth = Math.max(config.minWidth, Math.min(config.maxWidth, startWidth + (mouseUpEvent.clientX - startX)));
              LeftMarksStorage.saveState({ width: finalWidth, isCollapsed: false });
            } else {
              // 如果是点击，收起侧边栏
              toggleCollapse();
            }
            
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };
          
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
        title="拖拽调整宽度，点击收起侧边栏"
      >
        ‹
      </div>

      {/* 图片部分 */}
      <div className="img-box">
        <Image src={mengsPhoto} style={{ width: '120px' }}></Image>
        {/* TODO 加一下联系方式和链接 */}
      </div>
      {/* 介绍部分 */}
      <div className="desc-box">
        {/* 首页 */}
        <a 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            navigateWithMeng('/');
          }}
          className="nav-link home-link"
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-text">Meng's home</span>
          {location.pathname === '/' && <span className="active-indicator">●</span>}
        </a>
        
        {/* 前端工作介绍 */}
        <a 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            navigateWithMeng('/career');
          }}
          className="nav-link career-link"
        >
          <span className="nav-icon">💻</span>
          <span className="nav-text">前端Meng</span>
          {location.pathname.startsWith('/career') && <span className="active-indicator">●</span>}
        </a>
        
        {location.pathname.startsWith('/career') && (
          <>
            <div 
              onClick={() => navigateWithMeng('/career/resume')} 
              className={`sub-nav-item ${location.pathname === '/career/resume' ? 'active' : ''}`}
              data-path="/career/resume"
            >
              <span className="sub-nav-icon">📄</span>
              <span className="sub-nav-text">简历页面</span>
              {location.pathname === '/career/resume' && <span className="active-indicator">●</span>}
            </div>
            <div 
              onClick={() => navigateWithMeng('/career/detail')} 
              className={`sub-nav-item ${location.pathname === '/career/detail' ? 'active' : ''}`}
              data-path="/career/detail"
            >
              <span className="sub-nav-icon">🧭</span>
              <span className="sub-nav-text">前端详情页</span>
              {location.pathname === '/career/detail' && <span className="active-indicator">●</span>}
            </div>
            <div 
              onClick={() => navigateWithMeng('/career/blogsTree')} 
              className={`sub-nav-item ${location.pathname === '/career/blogsTree' ? 'active' : ''}`}
              data-path="/career/blogsTree"
            >
              <span className="sub-nav-icon">🌳</span>
              <span className="sub-nav-text">前端知识树</span>
              {location.pathname === '/career/blogsTree' && <span className="active-indicator">●</span>}
            </div>
            <div 
              onClick={() => navigateWithMeng('/career/blogsWithTimeline')} 
              className={`sub-nav-item ${location.pathname === '/career/blogsWithTimeline' ? 'active' : ''}`}
              data-path="/career/blogsWithTimeline"
            >
              <span className="sub-nav-icon">📅</span>
              <span className="sub-nav-text">Blogs with timeLine</span>
              {location.pathname === '/career/blogsWithTimeline' && <span className="active-indicator">●</span>}
            </div>
          </>
        )}
        
        {/* 算法工作介绍 */}
        {false && (
          <a href="/algorithm" className="nav-link algorithm-link">
            <span className="nav-icon">🧮</span>
            <span className="nav-text">算法Meng</span>
          </a>
        )}
        
        {/* 摄影介绍 */}
        <a 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            navigateWithMeng('/photography');
          }}
          className="nav-link photography-link"
        >
          <span className="nav-icon">📸</span>
          <span className="nav-text">摄影师Meng</span>
          {location.pathname.startsWith('/photography') && <span className="active-indicator">●</span>}
        </a>
        
        {location.pathname.startsWith('/photography') && (
          <>
            {/* 摄影师介绍 */}
            <div 
              onClick={() => navigateWithMeng('/photography/introduction')} 
              className={`sub-nav-item ${location.pathname === '/photography/introduction' ? 'active' : ''}`}
              data-path="/photography/introduction"
            >
              <span className="sub-nav-icon">📖</span>
              <span className="sub-nav-text">介绍</span>
              {location.pathname === '/photography/introduction' && <span className="active-indicator">●</span>}
            </div>
            
            {/* 底片展示 */}
            <div 
              onClick={() => navigateWithMeng('/photography/pictures')} 
              className={`sub-nav-item ${location.pathname === '/photography/pictures' ? 'active' : ''}`}
              data-path="/photography/pictures"
            >
              <span className="sub-nav-icon">🖼️</span>
              <span className="sub-nav-text">底片们</span>
              {location.pathname === '/photography/pictures' && <span className="active-indicator">●</span>}
            </div>
            
            {/* 拍摄时间线 */}
            <div 
              onClick={() => navigateWithMeng('/photography/timeline')} 
              className={`sub-nav-item ${location.pathname === '/photography/timeline' ? 'active' : ''}`}
              data-path="/photography/timeline"
            >
              <span className="sub-nav-icon">⏰</span>
              <span className="sub-nav-text">拍摄时间线</span>
              {location.pathname === '/photography/timeline' && <span className="active-indicator">●</span>}
            </div>
            
            {/* meng模式下的底片管理功能 */}
            {searchParams.get('meng') === 'true' && (
              <div 
                onClick={() => { 
                  window.location.href = '/photography/management?meng=true';
                }} 
                className={`sub-nav-item ${location.pathname === '/photography/management' ? 'active' : ''}`}
                data-path="/photography/management"
              >
                <span className="sub-nav-icon">📁</span>
                <span className="sub-nav-text">底片管理</span>
                {location.pathname === '/photography/management' && <span className="active-indicator">●</span>}
              </div>
            )}
          </>
        )}

        {/* 个人日记等 */}
        <a 
          href={searchParams.get('meng') === 'true' ? '/writing?meng=true' : '/writing'} 
          className="nav-link writing-link"
        >
          <span className="nav-icon">✍️</span>
          <span className="nav-text">Meng's碎碎念</span>
          {location.pathname === '/writing' && <span className="active-indicator">●</span>}
        </a>

        {/* 每日待办 */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigateWithMeng('/todo');
          }}
          className="nav-link todo-link"
        >
          <span className="nav-icon">✅</span>
          <span className="nav-text">每日待办</span>
          {location.pathname === '/todo' && <span className="active-indicator">●</span>}
        </a>
      </div>
    </div>
  );
};

export default LeftMarks;
