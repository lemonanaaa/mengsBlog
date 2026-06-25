import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Input, message, Spin, Tag } from 'antd';
import { CrownOutlined, DeleteOutlined, LockOutlined, SaveOutlined, SearchOutlined } from '@ant-design/icons';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor';
import Layout from '../common/Layout';
import JournalHeatmap from './JournalHeatmap';
import {
  createJournalEntry,
  deleteJournalEntry,
  fetchJournalDailyStats,
  fetchJournalEntries,
  JournalDailyStat,
  JournalEntry,
  JournalSearchResult,
  searchJournalEntries,
} from './api';
import { getHeatmapRangeForYear, getStatsYear, toShanghaiDateKey } from '../todo/dateUtils';
import '@wangeditor/editor/dist/css/style.css';
import '../../css/writing/writing.css';

const JOURNAL_PASSWORD = '125';
const UNLOCK_KEY = 'journal_unlocked';

const formatDateLabel = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return `${year}年${month}月${day}日`;
};

const formatTimeOnly = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const highlightSnippet = (snippet: string, query: string) => {
  if (!query.trim()) return snippet;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = snippet.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={`${part}-${index}`} className="journal-search-mark">
        {part}
      </mark>
    ) : (
      part
    )
  );
};

const Writings = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMeng = searchParams.get('meng') === 'true';

  const [unlocked, setUnlocked] = useState(
    () => localStorage.getItem(UNLOCK_KEY) === 'true'
  );
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [editor, setEditor] = useState<IDomEditor | null>(null);
  const editorRef = useRef<IDomEditor | null>(null);
  const [content, setContent] = useState('<p></p>');
  const [saving, setSaving] = useState(false);

  const [statsYear] = useState(() => getStatsYear());
  const [selectedDate, setSelectedDate] = useState(() => toShanghaiDateKey());
  const [dailyStats, setDailyStats] = useState<JournalDailyStat[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<JournalSearchResult[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [highlightedEntryId, setHighlightedEntryId] = useState<string | null>(null);

  const totalEntries = useMemo(
    () => dailyStats.reduce((sum, item) => sum + item.count, 0),
    [dailyStats]
  );

  const toolbarConfig: Partial<IToolbarConfig> = {
    toolbarKeys: [
      'headerSelect',
      '|',
      'bold',
      'italic',
      'underline',
      'through',
      '|',
      'bulletedList',
      'numberedList',
      'blockquote',
      '|',
      'insertLink',
      'codeBlock',
      '|',
      'undo',
      'redo',
    ],
  };

  const editorConfig: Partial<IEditorConfig> = {
    placeholder: '今天想记点什么…',
  };

  useEffect(() => {
    if (!isMeng) {
      navigate('/', { replace: true });
    }
  }, [isMeng, navigate]);

  useEffect(() => {
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  const handleEditorCreated = (ed: IDomEditor) => {
    editorRef.current = ed;
    setEditor(ed);
  };

  const loadDailyStats = useCallback(async () => {
    const { startKey, endKey } = getHeatmapRangeForYear(statsYear);
    const stats = await fetchJournalDailyStats(startKey, endKey);
    setDailyStats(stats);
  }, [statsYear]);

  const loadEntries = useCallback(async (date: string) => {
    const list = await fetchJournalEntries(date);
    setEntries(list);
  }, []);

  useEffect(() => {
    if (!isMeng || !unlocked) return;

    let cancelled = false;
    setInitialLoading(true);

    loadDailyStats()
      .catch((error) => {
        console.error('加载日记统计失败:', error);
        if (!cancelled) message.error('加载日记失败，请确认后端服务已启动');
      })
      .finally(() => {
        if (!cancelled) setInitialLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isMeng, unlocked, loadDailyStats]);

  useEffect(() => {
    if (!isMeng || !unlocked || initialLoading) return;

    let cancelled = false;
    setEntriesLoading(true);

    loadEntries(selectedDate)
      .catch((error) => {
        console.error('加载日记失败:', error);
        if (!cancelled) message.error('加载当日日记失败');
      })
      .finally(() => {
        if (!cancelled) setEntriesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isMeng, unlocked, initialLoading, selectedDate, loadEntries]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchTotal(0);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await searchJournalEntries(searchQuery.trim());
        if (!cancelled) {
          setSearchResults(data.items);
          setSearchTotal(data.total);
        }
      } catch (error) {
        console.error('检索日记失败:', error);
        if (!cancelled) message.error('检索失败，请稍后重试');
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (!highlightedEntryId) return;
    const timer = window.setTimeout(() => {
      const node = document.getElementById(`journal-entry-${highlightedEntryId}`);
      node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
    const clearTimer = window.setTimeout(() => setHighlightedEntryId(null), 2400);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(clearTimer);
    };
  }, [highlightedEntryId, entries]);

  const handleUnlock = () => {
    setPasswordLoading(true);
    if (passwordInput === JOURNAL_PASSWORD) {
      localStorage.setItem(UNLOCK_KEY, 'true');
      setUnlocked(true);
      message.success('欢迎回来');
    } else {
      message.error('密码不对');
    }
    setPasswordLoading(false);
  };

  const handleSave = async () => {
    const plain = content.replace(/<[^>]+>/g, '').trim();
    if (!plain) {
      message.warning('先写点什么吧');
      return;
    }

    setSaving(true);
    try {
      await createJournalEntry(selectedDate, content);
      setContent('<p></p>');
      editor?.setHtml('<p></p>');
      await loadDailyStats();
      await loadEntries(selectedDate);
      message.success('日记已保存');
    } catch (error) {
      console.error('保存日记失败:', error);
      message.error('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteJournalEntry(id);
      await loadDailyStats();
      await loadEntries(selectedDate);
      message.success('已删除');
    } catch (error) {
      console.error('删除日记失败:', error);
      message.error('删除失败');
    }
  };

  const handleSearchResultClick = (entry: JournalSearchResult) => {
    setSelectedDate(entry.date);
    setHighlightedEntryId(entry._id);
  };

  if (!isMeng) {
    return null;
  }

  if (!unlocked) {
    return (
      <Layout>
        <div className="journal-page journal-page--locked">
          <div className="journal-lock-card">
            <div className="journal-lock-icon">
              <LockOutlined />
            </div>
            <h1>Meng&apos;s 碎碎念</h1>
            <p>输入密码后查看和写日记</p>
            <Input.Password
              size="large"
              placeholder="密码"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onPressEnter={handleUnlock}
            />
            <Button
              type="primary"
              size="large"
              loading={passwordLoading}
              onClick={handleUnlock}
              block
            >
              进入
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="journal-page">
        <header className="journal-header">
          <div>
            <h1>Meng&apos;s 碎碎念</h1>
            <p className="journal-subtitle">私人日记 · 记录一些不想对外公开的小想法</p>
          </div>
          <Tag color="purple" icon={<CrownOutlined />}>
            meng模式
          </Tag>
        </header>

        {initialLoading ? (
          <div className="journal-loading">
            <Spin tip="加载中…" />
          </div>
        ) : (
          <>
            <section
              className={`journal-section journal-calendar-section${calendarOpen ? " is-open" : ""}`}
            >
              <button
                type="button"
                className="journal-calendar-toggle"
                onClick={() => setCalendarOpen((open) => !open)}
                aria-expanded={calendarOpen}
              >
                <span className="journal-calendar-toggle-title">写作日历</span>
                <span className="journal-calendar-toggle-meta">
                  {statsYear}年共 {totalEntries} 篇 · {formatDateLabel(selectedDate)}
                  <span className="journal-calendar-toggle-icon">{calendarOpen ? "▾" : "▸"}</span>
                </span>
              </button>
              {calendarOpen && (
                <JournalHeatmap
                  stats={dailyStats}
                  statsYear={statsYear}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
              )}
            </section>

            <section className="journal-section journal-editor-section">
              <h2 className="journal-section-title">
                写日记 · {formatDateLabel(selectedDate)}
              </h2>
              <div className="journal-editor-wrap">
                <Toolbar
                  editor={editor}
                  defaultConfig={toolbarConfig}
                  mode="default"
                  className="journal-editor-toolbar"
                />
                <Editor
                  defaultConfig={editorConfig}
                  value={content}
                  onCreated={handleEditorCreated}
                  onChange={(ed) => setContent(ed.getHtml())}
                  mode="default"
                  className="journal-editor-content"
                />
              </div>
              <div className="journal-editor-actions">
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={saving}
                  onClick={handleSave}
                >
                  保存日记
                </Button>
              </div>

              {(entriesLoading || entries.length > 0) && (
                <div className="journal-today-stream">
                  <div className="journal-today-stream-head">
                    <span>今日碎碎念</span>
                    {!entriesLoading && entries.length > 0 && (
                      <span className="journal-today-count">{entries.length}</span>
                    )}
                  </div>

                  {entriesLoading ? (
                    <div className="journal-list-loading">
                      <Spin size="small" />
                    </div>
                  ) : (
                    <ol className="journal-stream">
                      {entries.map((entry) => (
                        <li
                          key={entry._id}
                          id={`journal-entry-${entry._id}`}
                          className={`journal-stream-item${
                            highlightedEntryId === entry._id ? ' is-highlighted' : ''
                          }`}
                        >
                          <div className="journal-stream-rail" aria-hidden="true">
                            <span className="journal-stream-dot" />
                          </div>
                          <article className="journal-stream-note">
                            <header className="journal-stream-note-head">
                              <time dateTime={entry.createdAt}>{formatTimeOnly(entry.createdAt)}</time>
                              <button
                                type="button"
                                className="journal-stream-delete"
                                onClick={() => handleDelete(entry._id)}
                                aria-label="删除这条碎碎念"
                              >
                                <DeleteOutlined />
                              </button>
                            </header>
                            <div
                              className="journal-stream-content"
                              dangerouslySetInnerHTML={{ __html: entry.content }}
                            />
                          </article>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </section>

            <section className="journal-search-section">
              <Input
                allowClear
                size="large"
                prefix={<SearchOutlined />}
                placeholder="检索碎碎念…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {searchQuery.trim() ? (
                <div className="journal-search-body">
                  {searchLoading ? (
                    <div className="journal-list-loading">
                      <Spin size="small" />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <p className="journal-search-empty">
                      没有找到包含「{searchQuery.trim()}」的碎碎念
                    </p>
                  ) : (
                    <>
                      <p className="journal-search-summary">
                        找到 {searchTotal} 条结果
                        {searchTotal > searchResults.length ? `，展示前 ${searchResults.length} 条` : ''}
                      </p>
                      <ul className="journal-search-results">
                        {searchResults.map((entry) => (
                          <li key={entry._id}>
                            <button
                              type="button"
                              className="journal-search-result"
                              onClick={() => handleSearchResultClick(entry)}
                            >
                              <span className="journal-search-result-date">
                                {formatDateLabel(entry.date)}
                              </span>
                              <span className="journal-search-result-time">
                                {formatTimeOnly(entry.createdAt)}
                              </span>
                              <span className="journal-search-result-snippet">
                                {highlightSnippet(entry.snippet, searchQuery.trim())}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              ) : null}
            </section>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Writings;
