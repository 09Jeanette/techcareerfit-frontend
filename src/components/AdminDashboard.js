import React, { useEffect, useMemo, useState } from 'react';
import { BASE_URL, authHeaders } from '../api/config';

const defaultSummary = {
  total_users: 0,
  active_users: 0,
  total_cvs: 0,
  total_jobs: 0,
  total_reports: 0,
  recent_activity: []
};

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'cvs', label: 'CVs' },
  { id: 'applications', label: 'Applications' }
];

// Lightweight helpers used by the admin dashboard
async function parseJsonResponse(res) {
  try {
    const text = await res.text();
    if (!text) return {};
    try { return JSON.parse(text); } catch { return { message: text }; }
  } catch (err) {
    return {};
  }
}


function isWelcomePayload(payload) {
  if (!payload) return false;
  const msg = (payload.message || payload.msg || payload.welcome || '').toString().toLowerCase();
  return msg.includes('welcome') || msg.includes('techcareerfit');
}

function asArray(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function pickNumber(...vals) {
  for (const v of vals) {
    if (v == null) continue;
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

function isUserSuspended(user) {
  if (!user) return false;
  const status = (user.status || user.account_status || user.user_status || '').toString().toLowerCase();
  if (status === 'suspended' || status === 'disabled' || status === 'inactive') return true;
  if (user.suspended === true || user.is_suspended === true) return true;
  return false;
}


export default function AdminDashboard() {
  const [summary, setSummary] = useState(defaultSummary);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [createForm, setCreateForm] = useState({ full_name: '', email: '', password: '' });
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [cvModalOpen, setCvModalOpen] = useState(false);
  const [cvModalContent, setCvModalContent] = useState(null);
  const [cvModalTitle, setCvModalTitle] = useState('');
  const [selectedUserReports, setSelectedUserReports] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedAppDetails, setSelectedAppDetails] = useState(null);

  // loadAdminData moved inside component so it can access state setters
  async function loadAdminData() {
    try {
      setLoading(true);
      setError('');

      // First fetch the /admin/ summary which contains charts and high-level metrics
      const summaryRes = await fetch(`${BASE_URL}/admin/`, { headers: { 'Content-Type': 'application/json', ...authHeaders() } });
      const summaryJson = await parseJsonResponse(summaryRes);

      if (!summaryRes.ok) {
        // If backend returned welcome message or a public response, surface a clear error
        if (isWelcomePayload(summaryJson)) {
          throw new Error('Admin endpoint returned public welcome message. Check authentication or proxy configuration.');
        }
        throw new Error(summaryJson?.message || 'Unable to load admin summary');
      }

      const normalizedSummary = normalizeSummary(summaryJson || {});

      // Next fetch list endpoints in parallel (including applications)
      const [usersRes, jobsRes, cvsRes, appsRes] = await Promise.all([
        fetch(`${BASE_URL}/admin/users/`, { headers: { 'Content-Type': 'application/json', ...authHeaders() } }),
        fetch(`${BASE_URL}/admin/jobs/`, { headers: { 'Content-Type': 'application/json', ...authHeaders() } }),
        fetch(`${BASE_URL}/admin/cvs/`, { headers: { 'Content-Type': 'application/json', ...authHeaders() } }),
        fetch(`${BASE_URL}/admin/applications/`, { headers: { 'Content-Type': 'application/json', ...authHeaders() } })
      ]);

      const usersJson = await parseJsonResponse(usersRes);
      const jobsJson = await parseJsonResponse(jobsRes);
      const cvsJson = await parseJsonResponse(cvsRes);
      const appsJson = await parseJsonResponse(appsRes);

      const normalizedUsers = asArray(usersJson?.users ?? usersJson?.data ?? usersJson?.items ?? usersJson ?? []).map((user) => ({
        ...user,
        id: user.id ?? user.user_id ?? user._id ?? user.email ?? null,
        status: isUserSuspended(user) ? 'suspended' : (user.status ?? user.account_status ?? user.user_status ?? 'active')
      }));

      // Build lookup maps for owners
      const usersById = normalizedUsers.reduce((m, u) => { if (u?.id) m[u.id] = u; if (u?.user_id) m[u.user_id] = u; return m; }, {});

      const rawJobs = asArray(jobsJson?.jobs ?? jobsJson?.data ?? jobsJson?.items ?? jobsJson ?? []);
      const normalizedJobs = rawJobs.map((job) => ({
        ...job,
        id: job.id ?? job._id ?? job.job_id ?? null,
        user_id: job.user_id ?? job.owner_id ?? job.user ?? null,
        owner: usersById[job.user_id] || usersById[job.owner_id] || null,
        owner_name: (usersById[job.user_id]?.full_name) || (usersById[job.owner_id]?.full_name) || job.owner_name || job.owner_email || null
      }));


      const rawCvs = asArray(cvsJson?.cvs ?? cvsJson?.data ?? cvsJson?.items ?? cvsJson ?? []);
      const normalizedCvs = rawCvs.map((cv) => ({
        ...cv,
        id: cv.id ?? cv.cv_id ?? null,
        user_id: cv.user_id ?? cv.owner_id ?? null,
        owner: usersById[cv.user_id] || usersById[cv.owner_id] || null,
        owner_name: (usersById[cv.user_id]?.full_name) || cv.owner_name || cv.owner_email || null
      }));

      setSummary({ ...defaultSummary, ...normalizedSummary });
      setUsers(normalizedUsers);
      setJobs(normalizedJobs);
      setCvs(normalizedCvs);
      const normalizedApps = asArray(appsJson?.applications ?? appsJson?.data ?? appsJson?.items ?? appsJson ?? []);
      setApplications(normalizedApps);
    } catch (err) {
      setSummary(defaultSummary);
      setUsers([]);
      setJobs([]);
      setCvs([]);
      setError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }

  function normalizeSummary(payload = {}) {
    // Handle new /admin/ contract: top-level metrics + `summary` and `charts` objects
    const normalizedUsers = asArray(payload.users ?? payload.data?.users ?? payload.user_list ?? payload.items?.users ?? []);
    const normalizedJobs = asArray(payload.jobs ?? payload.data?.jobs ?? payload.job_list ?? payload.items?.jobs ?? []);
    const normalizedReports = asArray(payload.reports ?? payload.data?.reports ?? payload.report_list ?? payload.items?.reports ?? []);
    const normalizedCvs = asArray(payload.cvs ?? payload.data?.cvs ?? payload.cv_list ?? payload.items?.cvs ?? []);

    const summaryObj = payload.summary ?? {};
    const charts = payload.charts ?? summaryObj.charts ?? {};

    const total_users = pickNumber(payload.users, summaryObj.users, normalizedUsers.length, payload.total_users, payload.users_count);
    const suspended_users = pickNumber(summaryObj.suspended_users, payload.suspended_users, 0);
    const active_users = pickNumber(payload.active_users, payload.active_count, total_users - suspended_users, summaryObj.active_users, 0);
    const total_cvs = pickNumber(payload.cvs, summaryObj.cvs, normalizedCvs.length, payload.total_cvs, payload.cvs_count);
    const total_jobs = pickNumber(payload.jobs, (charts.jobs_by_company ? charts.jobs_by_company.reduce((s, x) => s + Number(x.value || 0), 0) : null), normalizedJobs.length, payload.total_jobs);
    const total_reports = pickNumber(payload.reports, summaryObj.reports, normalizedReports.length, payload.total_reports, payload.reports_count);

    return {
      total_users,
      active_users,
      total_cvs,
      total_jobs,
      total_reports,
      recent_activity: payload.recent_activity ?? payload.activity ?? payload.timeline ?? summaryObj.recent_activity ?? summaryObj.activity ?? [],
      rawSummary: summaryObj,
      charts
    };
  }



  useEffect(() => {
    // Ensure we land on the overview (admin stats) when visiting /admin
    setActiveTab('overview');
    loadAdminData();
  }, []);

  function fileNameFromUrl(url) {
    try {
      if (!url) return null;
      const parts = url.split('?')[0].split('/');
      return parts.pop() || parts.pop();
    } catch (e) {
      return null;
    }
  }

  async function handleCvClick(cv) {
    setError('');
    // If parsed data exists, show it in modal
    const parsed = cv.parsed_data || cv.parsed || cv.parsedResult || cv.parsed_results;
    if (parsed) {
      setCvModalTitle(`Parsed CV${cv.owner_name ? ' — ' + cv.owner_name : ''}`);
      setCvModalContent(parsed);
      setCvModalOpen(true);
      return;
    }

    // Try fetching parsed data from server endpoint if available
    if (cv.id) {
      try {
        const parsedRes = await fetch(`${BASE_URL}/admin/cvs/${cv.id}/parsed`, { headers: { 'Content-Type': 'application/json', ...authHeaders() } });
        if (parsedRes.ok) {
          const parsedJson = await parseJsonResponse(parsedRes);
          if (parsedJson && Object.keys(parsedJson).length) {
            setCvModalTitle(`Parsed CV${cv.owner_name ? ' — ' + cv.owner_name : ''}`);
            setCvModalContent(parsedJson);
            setCvModalOpen(true);
            return;
          }
        }
      } catch (e) {
        // ignore and fallback to file_url
      }
    }

    // Otherwise open the file URL in a new tab to trigger download/view
    if (cv.file_url) {
      try {
        window.open(cv.file_url, '_blank');
      } catch (err) {
        setError('Unable to open file URL');
      }
      return;
    }

    setError('No downloadable file or parsed data available for this CV');
  }

  async function loadUserReports(userId) {
    setSelectedUserReports([]);
    if (!userId) return;
    setError('');
    try {
      // Try user-specific reports endpoint first
      let res = await fetch(`${BASE_URL}/admin/users/${userId}/reports`, { headers: { 'Content-Type': 'application/json', ...authHeaders() } });
      if (!res.ok) {
        // Fallback to generic reports endpoint with query
        res = await fetch(`${BASE_URL}/admin/reports?user_id=${encodeURIComponent(userId)}`, { headers: { 'Content-Type': 'application/json', ...authHeaders() } });
      }
      if (!res.ok) {
        return; // no reports available
      }
      const payload = await parseJsonResponse(res);
      const listRaw = payload?.reports ?? payload?.data ?? payload?.items ?? payload;
      const list = asArray(listRaw ?? []);
      setSelectedUserReports(list);
    } catch (err) {
      // silent fallback
    }
  }

  async function loadApplicationDetails(app) {
    setSelectedAppDetails({ loading: true, app, cvs: [], reports: [] });
    if (!app) return;
    try {
      const appId = app.id ?? app.application_id;
      // Try to load application full record
      let detailRes = null;
      if (appId) {
        detailRes = await fetch(`${BASE_URL}/admin/applications/${appId}`, { headers: { 'Content-Type': 'application/json', ...authHeaders() } });
      }
      const detailJson = detailRes && detailRes.ok ? await parseJsonResponse(detailRes) : null;

      // Try reports for application
      let reports = [];
      if (appId) {
        try {
          let r = await fetch(`${BASE_URL}/admin/applications/${appId}/reports`, { headers: { 'Content-Type': 'application/json', ...authHeaders() } });
          if (!r.ok) r = await fetch(`${BASE_URL}/admin/reports?application_id=${encodeURIComponent(appId)}`, { headers: { 'Content-Type': 'application/json', ...authHeaders() } });
          if (r.ok) {
            const pj = await parseJsonResponse(r);
            reports = asArray(pj.reports ?? pj.data ?? pj.items ?? pj ?? []);
          }
        } catch (e) { /* ignore */ }
      }

      // Try to get related CVs (from application or detail)
      let cvsList = [];
      try {
        if (detailJson && (detailJson.cvs || detailJson.cv)) {
          cvsList = asArray(detailJson.cvs ?? detailJson.cv ?? []);
        } else if (app.cv_id) {
          let r = await fetch(`${BASE_URL}/admin/cvs/${app.cv_id}`, { headers: { 'Content-Type': 'application/json', ...authHeaders() } });
          if (r.ok) {
            const pj = await parseJsonResponse(r);
            cvsList = asArray(pj || []);
          }
        } else if (app.cv_url) {
          cvsList = [app];
        }
      } catch (e) {}

      setSelectedAppDetails({ loading: false, app, cvs: cvsList, reports });
    } catch (err) {
      setSelectedAppDetails({ loading: false, app, cvs: [], reports: [] });
    }
  }

  const statCards = useMemo(
    () => [
      { label: 'Total users', value: summary.total_users, accent: 'orange' },
      { label: 'Active users', value: summary.active_users, accent: 'green' },
      { label: 'CVs uploaded', value: summary.total_cvs, accent: 'black' },
      { label: 'Jobs tracked', value: summary.total_jobs, accent: 'orange' },
      { label: 'Applications', value: applications.length, accent: 'purple' }
    ],
    [summary, applications]
  );

  const roleBreakdown = useMemo(() => {
    const chartRoles = summary.charts?.users_by_role;
    if (chartRoles && chartRoles.length) {
      return chartRoles.map((r) => ({
        label: r.label,
        value: Number(r.value || 0),
        color: r.label === 'admin' ? '#ff6a00' : (String(r.label).toLowerCase().includes('job') ? '#28a745' : '#0b0b0b')
      }));
    }

    const adminCount = users.filter((user) => String(user.role).toLowerCase() === 'admin').length;
    const jobSeekerCount = users.filter((user) => String(user.role).toLowerCase() === 'job_seeker' || String(user.role).toLowerCase() === 'candidate').length;
    return [
      { label: 'Admins', value: adminCount, color: '#ff6a00' },
      { label: 'Job seekers', value: jobSeekerCount, color: '#28a745' },
      { label: 'Other', value: Math.max(users.length - adminCount - jobSeekerCount, 0), color: '#0b0b0b' }
    ];
  }, [users]);

  const chartBars = useMemo(() => {
    // Prefer applications-per-job bar chart when application data is available
    if (applications && applications.length) {
      const counts = {};
      for (const a of applications) {
        const job = (jobs.find((j) => j.id === a.job_id || j.job_id === a.job_id) || {});
        const label = (job.title || a.job_title || 'Unknown').toString();
        counts[label] = (counts[label] || 0) + 1;
      }
      const items = Object.keys(counts).map((k) => ({ label: k, value: counts[k] }));
      items.sort((a, b) => b.value - a.value);
      const max = Math.max(...items.map((i) => i.value), 1);
      return items.slice(0, 6).map((i) => ({ label: i.label, value: i.value, height: `${Math.max((i.value / max) * 100, 12)}%` }));
    }

    const jobsByCompany = summary.charts?.jobs_by_company;
    if (jobsByCompany && jobsByCompany.length) {
      const max = Math.max(...jobsByCompany.map((j) => Number(j.value || 0)), 1);
      return jobsByCompany.slice(0, 6).map((j) => ({ label: j.label, value: Number(j.value || 0), height: `${Math.max((Number(j.value || 0) / max) * 100, 12)}%` }));
    }

    // Fallback: derive jobs by company from `jobs` list if charts are not provided
    if (jobs && jobs.length) {
      const counts = {};
      for (const j of jobs) {
        const name = (j.company || j.company_name || 'Unknown').toString();
        counts[name] = (counts[name] || 0) + 1;
      }
      const items = Object.keys(counts).map((k) => ({ label: k, value: counts[k] }));
      items.sort((a, b) => b.value - a.value);
      const max = Math.max(...items.map((i) => i.value), 1);
      return items.slice(0, 6).map((i) => ({ label: i.label, value: i.value, height: `${Math.max((i.value / max) * 100, 12)}%` }));
    }

    const values = [summary.total_users, summary.total_jobs, summary.total_cvs, summary.total_reports];
    const max = Math.max(...values, 1);
    return values.map((value, index) => ({
      label: ['Users', 'Jobs', 'CVs', 'Reports'][index],
      value,
      height: `${Math.max((value / max) * 100, 12)}%`
    }));
  }, [summary]);

  const recentActivityList = useMemo(() => {
    if (summary.recent_activity && summary.recent_activity.length) return summary.recent_activity.slice(0, 5);
    const items = [];
    // users
    for (const u of (users || []).slice(-6).reverse()) {
      items.push({ label: u.full_name || u.email || 'User', detail: 'Account', time: u.created_at || u.created || u.joined_at || u.updated_at || null });
    }
    // jobs
    for (const j of (jobs || []).slice(-6).reverse()) {
      items.push({ label: j.title || 'Job', detail: j.company || '', time: j.created_at || j.posted_at || j.date || null });
    }
    // cvs
    for (const c of (cvs || []).slice(-6).reverse()) {
      items.push({ label: c.owner_name ? `CV - ${c.owner_name}` : 'CV', detail: c.file_name || fileNameFromUrl(c.file_url) || '', time: c.created_at || c.uploaded_at || null });
    }
    // sort by time when available (newest first), otherwise keep order
    const withTime = items.filter((i) => i.time).sort((a, b) => new Date(b.time) - new Date(a.time));
    const withoutTime = items.filter((i) => !i.time);
    return withTime.concat(withoutTime).slice(0, 5);
  }, [summary, users, jobs, cvs]);

  const donutValue = summary.total_users ? Math.round((summary.active_users / summary.total_users) * 100) : 0;

  async function createUser(e) {
    e.preventDefault();
    setError('');
    setNotice('');

    try {
      const res = await fetch(`${BASE_URL}/admin/users/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(createForm)
      });
      const payload = await parseJsonResponse(res);
      if (!res.ok) throw new Error(payload?.message || 'Unable to create user');
      setCreateForm({ full_name: '', email: '', password: '' });
      setNotice('User created successfully.');
      await loadAdminData();
    } catch (err) {
      setError(err.message || 'Unable to create user');
    }
  }

  async function promoteUser(userId) {
    setError('');
    setNotice('');

    try {
      const res = await fetch(`${BASE_URL}/admin/users/${userId}/promote`, {
        method: 'POST',
        headers: authHeaders()
      });
      const payload = await parseJsonResponse(res);
      if (!res.ok) throw new Error(payload?.message || 'Unable to promote user');
      setNotice('User promoted to admin.');
      await loadAdminData();
    } catch (err) {
      setError(err.message || 'Unable to promote user');
    }
  }

  async function toggleUserStatus(userId, action) {
    setError('');
    setNotice('');

    try {
      const endpoint = action === 'suspend' ? 'suspend' : 'unsuspend';
      const res = await fetch(`${BASE_URL}/admin/users/${userId}/${endpoint}`, {
        method: 'POST',
        headers: authHeaders()
      });
      const payload = await parseJsonResponse(res);
      if (!res.ok) throw new Error(payload?.message || `Unable to ${action} user`);
      setNotice(`User ${action}ed successfully.`);
      await loadAdminData();
    } catch (err) {
      setError(err.message || `Unable to ${action} user`);
    }
  }

  async function deleteJob(jobId) {
    setError('');
    setNotice('');

    try {
      const res = await fetch(`${BASE_URL}/admin/jobs/${jobId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const payload = await parseJsonResponse(res);
      if (!res.ok) throw new Error(payload?.message || 'Unable to delete job');
      setNotice('Job deleted successfully.');
      await loadAdminData();
    } catch (err) {
      setError(err.message || 'Unable to delete job');
    }
  }

  // reports endpoint removed from API - deleteReport disabled

  const renderOverview = () => (
    <>
      <div className="row g-4 mb-4">
        {statCards.map((card) => (
          <div className="col-md-6 col-xl" key={card.label}>
            <div className="admin-stat-card">
              <span className={`admin-stat-accent accent-${card.accent}`} />
              <div className="admin-stat-label">{card.label}</div>
              <div className="admin-stat-value">{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-7">
          <div className="admin-panel">
            <div className="panel-header mb-3">
              <h3>Platform growth</h3>
            </div>
            <div className="bar-chart" aria-label="Admin growth chart">
              {chartBars.map((bar) => (
                <div className="bar-column" key={bar.label}>
                  <div className="bar-value">{bar.value}</div>
                  <div className="bar-fill" style={{ height: bar.height }} />
                  <div className="bar-label">{bar.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="admin-panel">
            <div className="panel-header mb-3">
              <h3>User roles</h3>
            </div>
            <div className="donut-wrap">
              <div className="donut-chart" style={{ background: `conic-gradient(#ff6a00 0 ${Math.round((roleBreakdown[0].value / Math.max(users.length, 1)) * 100)}%, #28a745 ${Math.round((roleBreakdown[0].value / Math.max(users.length, 1)) * 100)}% ${Math.round(((roleBreakdown[0].value + roleBreakdown[1].value) / Math.max(users.length, 1)) * 100)}%, #0b0b0b ${Math.round(((roleBreakdown[0].value + roleBreakdown[1].value) / Math.max(users.length, 1)) * 100)}% 100%)` }}>
                <div className="donut-center">
                  <strong>{donutValue}%</strong>
                  <span>Active</span>
                </div>
              </div>
            </div>
            <div className="legend-list">
              {roleBreakdown.map((item) => (
                <div className="legend-item" key={item.label}>
                  <span className="legend-dot" style={{ background: item.color }} />
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="admin-panel">
            <div className="panel-header mb-3">
              <h3>Recent activity</h3>
            </div>
            <div className="list-group list-group-flush">
              {(summary.recent_activity && summary.recent_activity.length > 0) ? (
                summary.recent_activity.slice(0, 5).map((item, index) => (
                  <div className="list-group-item admin-list-item" key={`${item.label || 'activity'}-${index}`}>
                    <div>
                      <div className="fw-bold">{item.label || 'System update'}</div>
                      <small className="text-muted">{item.detail || 'No extra detail provided'}</small>
                    </div>
                    <span className="small text-muted">{item.time || 'Recently'}</span>
                  </div>
                ))
              ) : (
                <div className="list-group-item admin-list-item">
                  <div>
                    <div className="fw-bold">No recent activity</div>
                    <small className="text-muted">The system is quiet right now.</small>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="admin-panel">
            <div className="panel-header mb-3">
              <h3>Quick actions</h3>
            </div>
            <div className="d-grid gap-2">
              <button className="btn btn-primary" type="button" onClick={() => setActiveTab('users')}>Create user</button>
              <button className="btn btn-outline-dark" type="button" onClick={() => setActiveTab('cvs')}>Review CVs</button>
              <button className="btn btn-outline-dark" type="button" onClick={() => setActiveTab('jobs')}>Manage jobs</button>
              
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderUsers = () => (
    <div className="admin-panel">
      <div className="panel-header mb-3 d-flex justify-content-between align-items-center">
        <h3>Users</h3>
        <span className="chip chip-light">{users.length} records</span>
      </div>

      <form onSubmit={createUser} className="row g-2 mb-4">
        <div className="col-md-4">
          <input className="form-control" value={createForm.full_name} onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })} placeholder="Full name" required />
        </div>
        <div className="col-md-4">
          <input className="form-control" type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} placeholder="Email" required />
        </div>
        <div className="col-md-3">
          <input className="form-control" type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} placeholder="Password" required />
        </div>
        <div className="col-md-1">
          <button className="btn btn-primary w-100" type="submit">Add</button>
        </div>
      </form>

      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length ? users.map((user) => {
              const suspended = isUserSuspended(user);
              const isSelected = selectedUserId === (user.id ?? user.email ?? user.full_name);
              return (
                <tr key={user.id ?? user.email ?? user.full_name ?? Math.random()} className={`admin-user-row ${isSelected ? 'selected' : ''}`} onClick={() => { const uid = user.id ?? user.email ?? user.full_name; setSelectedUserId(uid); loadUserReports(uid); }} style={{ cursor: 'pointer' }}>
                  <td>{user.id ?? '-'}</td>
                  <td>{user.full_name ?? user.name ?? '-'}</td>
                  <td>{user.email ?? '-'}</td>
                  <td>{user.role ?? user.user_role ?? 'user'}</td>
                  <td><span className={`badge ${suspended ? 'bg-danger' : 'bg-success'}`}>{suspended ? 'Suspended' : 'Active'}</span></td>
                  <td>
                    <div className="d-flex gap-2 flex-wrap">
                      <button className="btn btn-sm btn-primary" type="button" onClick={(e) => { e.stopPropagation(); promoteUser(user.id); }}>Promote</button>
                      <button className="btn btn-sm btn-outline-dark" type="button" onClick={(e) => { e.stopPropagation(); toggleUserStatus(user.id, suspended ? 'unsuspend' : 'suspend'); }}>{suspended ? 'Unsuspend' : 'Suspend'}</button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan="6" className="text-center text-muted">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  function renderSelectedUserDetails() {
    if (!selectedUserId) return null;
    const userKey = selectedUserId;
    const selectedUser = users.find((u) => (u.id === userKey || u.email === userKey || u.full_name === userKey));
    const userJobs = jobs.filter((j) => j.user_id === selectedUser?.id || j.user_id === selectedUser?.user_id);
    const userCvs = cvs.filter((c) => c.user_id === selectedUser?.id || c.user_id === selectedUser?.user_id);

    return (
      <div className="admin-panel mt-4">
        <div className="panel-header mb-3 d-flex justify-content-between align-items-center">
          <h4>Selected user: {selectedUser?.full_name ?? selectedUser?.email ?? selectedUserId}</h4>
          <div>
            <button className="btn btn-sm btn-outline-secondary me-2" type="button" onClick={() => setSelectedUserId(null)}>Clear</button>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-md-6">
            <div className="admin-panel p-3">
              <h5>Jobs</h5>
              {userJobs.length ? (
                <ul className="list-unstyled small">
                  {userJobs.map((j) => (<li key={j.id ?? j._id}>{j.title ?? j.job_title ?? 'Untitled'}</li>))}
                </ul>
              ) : <div className="text-muted">No jobs</div>}
            </div>
          </div>

          <div className="col-md-6">
            <div className="admin-panel p-3">
              <h5>CVs</h5>
              {userCvs.length ? (
                <ul className="list-unstyled small">
                  {userCvs.map((c) => (<li key={c.id ?? c.cv_id}>{c.file_name ?? c.file_url ?? c.name}</li>))}
                </ul>
              ) : <div className="text-muted">No CVs</div>}
            </div>
          </div>
        
          <div className="col-12">
            <div className="admin-panel p-3">
              <h5>Reports</h5>
              { (selectedUserReports && selectedUserReports.length) || (selectedUser?.reports && selectedUser.reports.length) ? (
                <ul className="list-unstyled small">
                  {(selectedUserReports.length ? selectedUserReports : (selectedUser?.reports || [])).map((r, idx) => (
                    <li key={r.id ?? r.report_id ?? idx}>{r.title ?? r.summary ?? r.type ?? JSON.stringify(r).slice(0, 80)}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-muted">No reports for this user.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderJobs = () => (
    <div className="admin-panel">
      <div className="panel-header mb-3 d-flex justify-content-between align-items-center">
        <h3>Jobs</h3>
        <span className="chip chip-light">{jobs.length} records</span>
      </div>
      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Company</th>
              <th>Owner</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length ? jobs.map((job) => (
              <tr key={job.id ?? job._id ?? job.title ?? Math.random()}>
                <td>{job.id ?? '-'}</td>
                <td>{job.title ?? '-'}</td>
                <td>{job.company ?? '-'}</td>
                <td>{job.owner_name ?? job.owner?.full_name ?? job.owner?.email ?? '-'}</td>
                <td><button className="btn btn-sm btn-outline-danger" type="button" onClick={() => deleteJob(job.id ?? job._id)}>Delete</button></td>
              </tr>
            )) : (
              <tr><td colSpan="5" className="text-center text-muted">No jobs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderApplications = () => (
    <div className="admin-panel">
      <div className="panel-header mb-3 d-flex justify-content-between align-items-center">
        <h3>Applications</h3>
        <span className="chip chip-light">{applications.length} records</span>
      </div>
      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>ID</th>
              <th>Applicant</th>
              <th>Job</th>
              <th>Status</th>
            
            </tr>
          </thead>
          <tbody>
            {applications.length ? applications.map((app) => (
              <tr key={app.id ?? app.application_id ?? Math.random()} onClick={() => loadApplicationDetails(app)} style={{ cursor: 'pointer' }}>
                <td>{app.id ?? app.application_id ?? '-'}</td>
                <td>{app.applicant_name ?? app.candidate_name ?? app.email ?? '-'}</td>
                <td>{(jobs.find((j) => j.id === app.job_id || j.job_id === app.job_id) || {}).title ?? app.job_title ?? '-'}</td>
                <td>{app.status ?? app.application_status ?? '-'}</td>
                <td>
                  <div className="d-flex gap-2">
                    {app.cv_url ? <a className="btn btn-sm btn-outline-primary" href={app.cv_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>CV</a> : null}
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5" className="text-center text-muted">No applications found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  function renderSelectedApplication() {
    if (!selectedAppDetails || !selectedAppDetails.app) return null;
    const { app, cvs: appCvs = [], reports = [] } = selectedAppDetails;
    return (
      <div className="admin-panel mt-3">
        <div className="panel-header mb-3 d-flex justify-content-between align-items-center">
          <h4>Application: {app.applicant_name ?? app.candidate_name ?? app.email}</h4>
          <div>
            <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => setSelectedAppDetails(null)}>Close</button>
          </div>
        </div>
        <div className="row g-3">
          <div className="col-md-6">
            <div className="admin-panel p-3">
              <h5>CV</h5>
              {appCvs.length ? (
                <ul className="list-unstyled small">
                  {appCvs.map((c) => (
                    <li key={c.id ?? c.cv_id}>{c.file_name || fileNameFromUrl(c.file_url) || (c.name) || <a href={c.cv_url} target="_blank" rel="noreferrer">Open</a>}</li>
                  ))}
                </ul>
              ) : app.cv_url ? (<div><a href={app.cv_url} target="_blank" rel="noreferrer">Download CV</a></div>) : <div className="text-muted">No CV attached.</div>}
            </div>
          </div>
          <div className="col-md-6">
            <div className="admin-panel p-3">
              <h5>Reports</h5>
              {reports.length ? (
                <ul className="list-unstyled small">
                  {reports.map((r, i) => (<li key={r.id ?? r.report_id ?? i}><strong>{r.title ?? r.type ?? r.summary}</strong><div className="small text-muted">{r.detail || r.message || JSON.stringify(r)}</div></li>))}
                </ul>
              ) : <div className="text-muted">No reports for this application.</div>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reports UI removed (API not available)

  const renderCvs = () => (
    <div className="admin-panel">
      <div className="panel-header mb-3 d-flex justify-content-between align-items-center">
        <h3>CVs</h3>
        <span className="chip chip-light">{cvs.length} records</span>
      </div>
      <div className="table-responsive">
        <table className="table align-middle">
          <thead>
            <tr>
              <th>ID</th>
              <th>Owner</th>
              <th>File</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {cvs.length ? cvs.map((cv) => (
              <tr key={cv.id ?? cv.cv_id ?? Math.random()}>
                <td>{cv.id ?? cv.cv_id ?? '-'}</td>
                <td>{cv.owner_name ?? cv.owner?.full_name ?? cv.owner?.email ?? cv.owner_email ?? '-'}</td>
                <td>
                  <button className="btn btn-link p-0" type="button" onClick={() => handleCvClick(cv)}>
                    {cv.file_name || fileNameFromUrl(cv.file_url) || cv.name || 'Download'}
                  </button>
                </td>
                <td><span className={`badge ${cv.status === 'parsed' ? 'bg-success' : 'bg-secondary'}`}>{cv.status ?? 'uploaded'}</span></td>
              </tr>
            )) : (
              <tr><td colSpan="4" className="text-center text-muted">No CVs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTab = () => {
    switch (activeTab) {
      case 'users':
        return renderUsers();
      case 'jobs':
        return renderJobs();
      case 'applications':
        return renderApplications();
      
      case 'cvs':
        return renderCvs();
      default:
        return renderOverview();
    }
  };

  return (
    <div className={`admin-dashboard ${!loading ? 'data-ready' : ''}`}>
      <div className="admin-topbar">
        <div>
          <span className="eyebrow">Admin control</span>
          <h2>Operations dashboard</h2>
        </div>
        <div className="chip chip-orange">Admin access</div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      {loading ? (
        <div className="alert alert-warning loading-banner" role="status" aria-live="polite">
          <span className="loading-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </div>
      ) : (
        <>
          <div className="admin-tabs mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {renderTab()}
          {renderSelectedUserDetails()}
          {cvModalOpen && (
            <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
              <div className="modal-content p-3" style={{ background: '#fff', maxWidth: '800px', width: '95%', maxHeight: '80vh', overflow: 'auto', borderRadius: 6 }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="m-0">{cvModalTitle || 'Parsed CV'}</h5>
                  <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => { setCvModalOpen(false); setCvModalContent(null); }}>Close</button>
                </div>
                <div className="modal-body">
                  {cvModalContent ? (
                    typeof cvModalContent === 'string' ? (
                      <pre style={{ whiteSpace: 'pre-wrap' }}>{cvModalContent}</pre>
                    ) : (
                      <pre>{JSON.stringify(cvModalContent, null, 2)}</pre>
                    )
                  ) : (
                    <div className="text-muted">No parsed data available.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
