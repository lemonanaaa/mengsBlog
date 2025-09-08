import { NavigateFunction } from 'react-router-dom';

/**
 * 通用导航函数，自动保持meng参数
 * @param navigate React Router的navigate函数
 * @param searchParams URLSearchParams对象
 * @param path 目标路径
 */
export const navigateWithMeng = (
  navigate: NavigateFunction,
  searchParams: URLSearchParams,
  path: string
) => {
  const mengParam = searchParams.get('meng') === 'true' ? '?meng=true' : '';
  navigate(`${path}${mengParam}`);
};

/**
 * 创建带有meng参数的导航函数（用于在组件中使用）
 * @param navigate React Router的navigate函数
 * @param searchParams URLSearchParams对象
 * @returns 返回一个接受path参数的导航函数
 */
export const createNavigateWithMeng = (
  navigate: NavigateFunction,
  searchParams: URLSearchParams
) => {
  return (path: string) => navigateWithMeng(navigate, searchParams, path);
};

/**
 * 获取带有meng参数的URL字符串
 * @param searchParams URLSearchParams对象
 * @param path 目标路径
 * @returns 返回带有meng参数的完整URL字符串
 */
export const getUrlWithMeng = (searchParams: URLSearchParams, path: string): string => {
  const mengParam = searchParams.get('meng') === 'true' ? '?meng=true' : '';
  return `${path}${mengParam}`;
};
