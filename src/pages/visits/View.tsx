import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Spin, Switch, Tabs, Tag, message } from 'antd';
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import Layout from '../common/Layout';
import { fetchVisitDailyStats, fetchVisits, VisitDailyStat, VisitRecord } from './api';
import { toShanghaiDateKey, addShanghaiDays } from '../todo/dateUtils';
import '../../css/visits/visits.css';

type RangeKey = 'twoWeeks' | 'all';

const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

const formatFullPath = (visit: VisitRecord) => {
  const search = visit.search?.startsWith('?')
    ? visit.search
    : visit.search
      ? `?${visit.search}`
      : '';
  return `${visit.path}${search}`;
};

const VisitsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMeng = searchParams.get('meng') === 'true';

  const [range, setRange] = useState<RangeKey>('twoWeeks');
  const [privateOnly, setPrivateOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<VisitRecord[]>([]);
  const [tabTotal, setTabTotal] = useState(0);
  const [allTotal, setAllTotal] = useState(0);
  const [stats, setStats] = useState<VisitDailyStat[]>([]);

  useEffect(() => {
    if (!isMeng) {
      navigate('/', { replace: true });
    }
  }, [isMeng, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const today = toShanghaiDateKey();
      const from14 = addShanghaiDays(today, -13);
      const isTwoWeeks = range === 'twoWeeks';

      const [list, daily, allList] = await Promise.all([
        fetchVisits({
          from: isTwoWeeks ? from14 : undefined,
          to: isTwoWeeks ? today : undefined,
          privateOnly,
          limit: isTwoWeeks ? 200 : 100,
        }),
        fetchVisitDailyStats(from14, today),
        fetchVisits({ limit: 1 }),
      ]);
      setItems(list.items);
      setTabTotal(list.total);
      setStats(daily);
      setAllTotal(allList.total);
    } catch (error) {
      console.error(error);
      message.error('加载访客记录失败');
    } finally {
      setLoading(false);
    }
  }, [range, privateOnly]);

  useEffect(() => {
    if (!isMeng) return;
    load();
  }, [isMeng, load]);

  if (!isMeng) return null;

  const todayKey = toShanghaiDateKey();
  const todayStat = stats.find((s) => s.date === todayKey);
  const weekCount = stats
    .filter((s) => s.date >= addShanghaiDays(todayKey, -6))
    .reduce((sum, s) => sum + s.count, 0);

  const listBody = loading ? (
    <div className="visits-loading">
      <Spin />
    </div>
  ) : items.length === 0 ? (
    <p className="visits-empty">还没有访客记录</p>
  ) : (
    <ul className="visits-list">
      {items.map((visit) => (
        <li
          key={visit._id}
          className={`visits-item${visit.isPrivate ? ' is-private' : ''}`}
        >
          <div className="visits-item-main">
            <time dateTime={visit.createdAt}>{formatDateTime(visit.createdAt)}</time>
            <code className="visits-path">{formatFullPath(visit)}</code>
            {visit.isPrivate && <Tag color="orange">私密页</Tag>}
            {visit.isMeng && <Tag color="purple">meng</Tag>}
          </div>
          <div className="visits-item-meta">
            <span>
              {visit.device} · {visit.browser}
            </span>
            {visit.ipMasked && <span>{visit.ipMasked}</span>}
            {visit.referrer ? (
              <span className="visits-referrer" title={visit.referrer}>
                来自 {visit.referrer.replace(/^https?:\/\//, '').slice(0, 40)}
              </span>
            ) : (
              <span className="visits-referrer">直接访问</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <Layout>
      <div className="visits-page">
        <header className="visits-header">
          <div>
            <h1>
              <EyeOutlined /> 访客记录
            </h1>
            <p className="visits-subtitle">全站访问痕迹 · 私密页单独标记</p>
          </div>
          <div className="visits-header-actions">
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
              刷新
            </Button>
          </div>
        </header>

        <section className="visits-summary">
          <div className="visits-summary-card">
            <span className="visits-summary-label">今日</span>
            <strong>{todayStat?.count ?? 0}</strong>
          </div>
          <div className="visits-summary-card">
            <span className="visits-summary-label">近 7 天</span>
            <strong>{weekCount}</strong>
          </div>
          <div className="visits-summary-card">
            <span className="visits-summary-label">累计</span>
            <strong>{allTotal}</strong>
          </div>
        </section>

        <Tabs
          className="visits-tabs"
          activeKey={range}
          onChange={(key) => setRange(key as RangeKey)}
          tabBarExtraContent={
            <div className="visits-tab-extra">
              <label className="visits-private-filter">
                <span>仅私密</span>
                <Switch
                  size="small"
                  checked={privateOnly}
                  onChange={setPrivateOnly}
                />
              </label>
              <span className="visits-range-count">当前 {tabTotal} 条</span>
            </div>
          }
          items={[
            { key: 'twoWeeks', label: '近两周', children: listBody },
            { key: 'all', label: '全部', children: listBody },
          ]}
        />
      </div>
    </Layout>
  );
};

export default VisitsPage;
