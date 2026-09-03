const { chromium } = require('playwright');

// Configuration — override with environment variables when running against different deployments.
// NOTE: The deeper CRUD semantics (create/list/delete) for cycles, labels, and projects are
// already covered by the Python contract tests in tests/contract/. These E2E tests complement
// them by exercising the full browser flow against a live deployment and checking UI routing.
const BASE_URL = process.env.PLANE_BASE_URL || 'http://localhost';
const EMAIL = process.env.PLANE_EMAIL || 'admin@plane.local';
const PASSWORD = process.env.PLANE_PASSWORD || 'admin';
const WORKSPACE_SLUG = process.env.PLANE_WORKSPACE_SLUG || 'my-workspace';

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = [];
  const consoleErrors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('React error #418') && !msg.text().includes('Canvas2D')) {
      consoleErrors.push(msg.text());
    }
  });

  function pass(test) {
    console.log('  ✓ ' + test);
    results.push({ test, status: 'PASS' });
  }
  
  function fail(test, details = '') {
    console.log('  ✗ ' + test + (details ? ': ' + details : ''));
    results.push({ test, status: 'FAIL', details });
  }
  
  function section(name) {
    console.log('\n── ' + name + ' ────────────────────────────────');
  }

  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  Plane E2E Comprehensive Test Suite (Based on Plane Repo)  ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  console.log('  Target: ' + BASE_URL + '  Workspace: ' + WORKSPACE_SLUG + '\n');
  
  try {
    // === LOGIN ===
    // Complements tests/smoke/test_auth_smoke.py which tests the login endpoint at the HTTP
    // level; this test verifies the full browser-based login flow including SPA hydration.
    section('Authentication');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(15000);
    
    await page.fill('input[name="email"]', EMAIL);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    
    await page.fill('input[name="password"]', PASSWORD);
    // Plane's password step uses a generic submit button; both login steps share this selector.
    await page.click('button[type="submit"]:not([disabled])');
    await page.waitForTimeout(6000);
    
    if (page.url().includes('/' + WORKSPACE_SLUG + '/')) {
      pass('Login and workspace redirect');
    } else {
      fail('Login', page.url());
    }
    
    // === INSTANCE & WORKSPACE APIs ===
    section('Instance & Workspace APIs');
    
    const instanceData = await page.evaluate((url) => 
      fetch(url + '/api/instances/').then(r => r.json())
    , BASE_URL);
    if (instanceData.instance?.instance_name) {
      pass('Instance API (' + instanceData.instance.instance_name + ')');
    } else {
      fail('Instance API', JSON.stringify(instanceData.instance));
    }
    
    const userData = await page.evaluate((url) => 
      fetch(url + '/api/users/me/').then(r => r.json())
    , BASE_URL);
    if (userData.email) {
      pass('User /me API (' + userData.email + ')');
    } else {
      fail('User /me API', JSON.stringify(userData));
    }
    
    const workspacesData = await page.evaluate((url) => 
      fetch(url + '/api/users/me/workspaces/').then(r => r.json())
    , BASE_URL);
    if (Array.isArray(workspacesData) && workspacesData.length > 0) {
      pass('User workspaces API (' + workspacesData.length + ' workspace)');
    } else {
      fail('User workspaces API');
    }
    
    const workspaceData = await page.evaluate(({ url, slug }) => 
      fetch(url + '/api/workspaces/' + slug + '/').then(r => r.json())
    , { url: BASE_URL, slug: WORKSPACE_SLUG });
    if (workspaceData.id && workspaceData.slug === WORKSPACE_SLUG) {
      pass('Workspace API (' + WORKSPACE_SLUG + ')');
    } else {
      fail('Workspace API', JSON.stringify(workspaceData));
    }
    
    // === PROJECT APIs ===
    // Note: detailed project CRUD contract tests live in tests/contract/app/test_project_app.py.
    // These smoke checks verify the endpoints are reachable on the live deployment.
    section('Project APIs');
    
    const projectsData = await page.evaluate(({ url, slug }) => 
      fetch(url + '/api/workspaces/' + slug + '/projects/').then(r => r.json())
    , { url: BASE_URL, slug: WORKSPACE_SLUG });
    if (Array.isArray(projectsData)) {
      pass('Projects list API (' + projectsData.length + ' projects)');
    } else {
      fail('Projects list API');
    }
    
    // Create a test project with unique identifier
    const timestamp = Date.now();
    const createProjectResponse = await page.evaluate(async ({ url, slug, ts }) => {
      const res = await fetch(url + '/api/workspaces/' + slug + '/projects/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Project from E2E ' + ts,
          identifier: 'TP' + ts.toString().slice(-4),
          description: 'Created by automated E2E test'
        })
      });
      return { status: res.status, data: await res.json() };
    }, { url: BASE_URL, slug: WORKSPACE_SLUG, ts: timestamp });
    
    if (createProjectResponse.status === 200 || createProjectResponse.status === 201) {
      pass('Create project API');
      var testProjectId = createProjectResponse.data.id;
      var testProjectIdentifier = createProjectResponse.data.identifier;
    } else {
      fail('Create project API', createProjectResponse.status + ': ' + JSON.stringify(createProjectResponse.data));
    }
    
    // Get project details
    if (testProjectId) {
      const projectDetail = await page.evaluate(async ({ url, slug, id }) => {
        const res = await fetch(url + '/api/workspaces/' + slug + '/projects/' + id + '/');
        return { status: res.status, data: await res.json() };
      }, { url: BASE_URL, slug: WORKSPACE_SLUG, id: testProjectId });
      
      if (projectDetail.status === 200) {
        pass('Get project details API');
      } else {
        fail('Get project details API', projectDetail.status);
      }
    }
    
    // === WORK ITEM (ISSUE) APIs ===
    section('Work Item (Issue) APIs');
    
    if (testProjectId) {
      const createWorkItemResponse = await page.evaluate(async ({ url, slug, projectId }) => {
        const res = await fetch(url + '/api/workspaces/' + slug + '/projects/' + projectId + '/issues/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test Work Item from E2E',
            description_html: '<p>Created by automated E2E test</p>'
          })
        });
        return { status: res.status, data: await res.json() };
      }, { url: BASE_URL, slug: WORKSPACE_SLUG, projectId: testProjectId });
      
      if (createWorkItemResponse.status === 200 || createWorkItemResponse.status === 201) {
        pass('Create work item API');
        var testWorkItemId = createWorkItemResponse.data.id;
      } else {
        fail('Create work item API', createWorkItemResponse.status);
      }
      
      const workItemsList = await page.evaluate(async ({ url, slug, projectId }) => {
        const res = await fetch(url + '/api/workspaces/' + slug + '/projects/' + projectId + '/issues/');
        const data = await res.json();
        return { status: res.status, data: data };
      }, { url: BASE_URL, slug: WORKSPACE_SLUG, projectId: testProjectId });
      
      if (workItemsList.status === 200) {
        pass('List work items API (' + (workItemsList.data.results || workItemsList.data.length || 'ok') + ' items)');
      } else {
        fail('List work items API');
      }
    }
    
    // === STATES APIs ===
    section('States APIs');
    
    if (testProjectId) {
      const statesData = await page.evaluate(async ({ url, slug, projectId }) => {
        const res = await fetch(url + '/api/workspaces/' + slug + '/projects/' + projectId + '/states/');
        return { status: res.status, data: await res.json() };
      }, { url: BASE_URL, slug: WORKSPACE_SLUG, projectId: testProjectId });
      
      if (statesData.status === 200 && Array.isArray(statesData.data)) {
        pass('Project states API (' + statesData.data.length + ' states)');
      } else {
        fail('Project states API');
      }
    }
    
    // === LABELS APIs ===
    // Note: detailed label CRUD contract tests live in tests/contract/api/test_labels.py.
    section('Labels APIs');
    
    if (testProjectId) {
      const labelsData = await page.evaluate(async ({ url, slug, projectId }) => {
        const res = await fetch(url + '/api/workspaces/' + slug + '/projects/' + projectId + '/issue-labels/');
        return { status: res.status, data: await res.json() };
      }, { url: BASE_URL, slug: WORKSPACE_SLUG, projectId: testProjectId });
      
      if (labelsData.status === 200 && Array.isArray(labelsData.data)) {
        pass('Project labels API (' + labelsData.data.length + ' labels)');
      } else {
        fail('Project labels API');
      }
    }
    
    // === CYCLES APIs ===
    // Note: detailed cycle CRUD contract tests live in tests/contract/api/test_cycles.py.
    section('Cycles APIs');
    
    if (testProjectId) {
      const cyclesData = await page.evaluate(async ({ url, slug, projectId }) => {
        const res = await fetch(url + '/api/workspaces/' + slug + '/projects/' + projectId + '/cycles/');
        return { status: res.status, data: await res.json() };
      }, { url: BASE_URL, slug: WORKSPACE_SLUG, projectId: testProjectId });
      
      if (cyclesData.status === 200 && Array.isArray(cyclesData.data)) {
        pass('Cycles list API (' + cyclesData.data.length + ' cycles)');
      } else {
        fail('Cycles list API');
      }
      
      // Create a cycle
      const createCycleResponse = await page.evaluate(async ({ url, slug, projectId }) => {
        const res = await fetch(url + '/api/workspaces/' + slug + '/projects/' + projectId + '/cycles/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test Cycle from E2E',
            description: 'Created by automated E2E test'
          })
        });
        return { status: res.status, data: await res.json() };
      }, { url: BASE_URL, slug: WORKSPACE_SLUG, projectId: testProjectId });
      
      if (createCycleResponse.status === 200 || createCycleResponse.status === 201) {
        pass('Create cycle API');
        var testCycleId = createCycleResponse.data.id;
      } else {
        fail('Create cycle API', createCycleResponse.status);
      }
    }
    
    // === MODULES APIs ===
    section('Modules APIs');
    
    if (testProjectId) {
      const modulesData = await page.evaluate(async ({ url, slug, projectId }) => {
        const res = await fetch(url + '/api/workspaces/' + slug + '/projects/' + projectId + '/modules/');
        return { status: res.status, data: await res.json() };
      }, { url: BASE_URL, slug: WORKSPACE_SLUG, projectId: testProjectId });
      
      if (modulesData.status === 200 && Array.isArray(modulesData.data)) {
        pass('Modules list API (' + modulesData.data.length + ' modules)');
      } else {
        fail('Modules list API');
      }
      
      // Create a module
      const createModuleResponse = await page.evaluate(async ({ url, slug, projectId }) => {
        const res = await fetch(url + '/api/workspaces/' + slug + '/projects/' + projectId + '/modules/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test Module from E2E',
            description: 'Created by automated E2E test'
          })
        });
        return { status: res.status, data: await res.json() };
      }, { url: BASE_URL, slug: WORKSPACE_SLUG, projectId: testProjectId });
      
      if (createModuleResponse.status === 200 || createModuleResponse.status === 201) {
        pass('Create module API');
        var testModuleId = createModuleResponse.data.id;
      } else {
        fail('Create module API', createModuleResponse.status);
      }
    }
    
    // === PAGES APIs ===
    section('Pages APIs');
    
    if (testProjectId) {
      const pagesData = await page.evaluate(async ({ url, slug, projectId }) => {
        const res = await fetch(url + '/api/workspaces/' + slug + '/projects/' + projectId + '/pages/');
        return { status: res.status, data: await res.json() };
      }, { url: BASE_URL, slug: WORKSPACE_SLUG, projectId: testProjectId });
      
      if (pagesData.status === 200 && Array.isArray(pagesData.data)) {
        pass('Project pages API (' + pagesData.data.length + ' pages)');
      } else {
        fail('Project pages API');
      }
    }
    
    // === MEMBERS APIs ===
    section('Members APIs');
    
    const workspaceMembersData = await page.evaluate(({ url, slug }) => 
      fetch(url + '/api/workspaces/' + slug + '/members/').then(r => ({ status: r.status, data: r.json().catch(() => ({})) }))
    , { url: BASE_URL, slug: WORKSPACE_SLUG });
    if (workspaceMembersData.status === 200) {
      const members = workspaceMembersData.data.results || workspaceMembersData.data;
      if (Array.isArray(members)) {
        pass('Workspace members API (' + members.length + ' members)');
      } else {
        pass('Workspace members API (accessible)');
      }
    } else {
      fail('Workspace members API', workspaceMembersData.status);
    }
    
    if (testProjectId) {
      const projectMembersData = await page.evaluate(async ({ url, slug, projectId }) => {
        const res = await fetch(url + '/api/workspaces/' + slug + '/projects/' + projectId + '/members/');
        return { status: res.status, data: await res.json() };
      }, { url: BASE_URL, slug: WORKSPACE_SLUG, projectId: testProjectId });
      
      if (projectMembersData.status === 200 && Array.isArray(projectMembersData.data)) {
        pass('Project members API (' + projectMembersData.data.length + ' members)');
      } else {
        fail('Project members API');
      }
    }
    
    // === INVITATIONS APIs ===
    section('Invitations APIs');
    
    const invitationsData = await page.evaluate(({ url, slug }) => 
      fetch(url + '/api/workspaces/' + slug + '/invitations/').then(r => ({ status: r.status, data: r.json().catch(() => ({})) }))
    , { url: BASE_URL, slug: WORKSPACE_SLUG });
    if (invitationsData.status === 200) {
      pass('Invitations API (accessible)');
    } else {
      fail('Invitations API', invitationsData.status);
    }
    
    // === USER FAVORITES APIs ===
    section('User Favorites APIs');
    
    const favoritesData = await page.evaluate(({ url, slug }) => 
      fetch(url + '/api/workspaces/' + slug + '/user-favorites/').then(r => ({ status: r.status, data: r.json().catch(() => ({})) }))
    , { url: BASE_URL, slug: WORKSPACE_SLUG });
    if (favoritesData.status === 200) {
      pass('User favorites API (accessible)');
    } else {
      fail('User favorites API', favoritesData.status);
    }
    
    // === VIEWS APIs ===
    section('Views APIs');
    
    if (testProjectId) {
      const viewsData = await page.evaluate(async ({ url, slug, projectId }) => {
        const res = await fetch(url + '/api/workspaces/' + slug + '/projects/' + projectId + '/views/');
        return { status: res.status, data: await res.json().catch(() => ({})) };
      }, { url: BASE_URL, slug: WORKSPACE_SLUG, projectId: testProjectId });
      
      if (viewsData.status === 200) {
        pass('Project views API (accessible)');
      } else {
        fail('Project views API', viewsData.status);
      }
    }
    
    // === STICKIES APIs ===
    section('Stickies APIs');
    
    const stickiesData = await page.evaluate(({ url, slug }) => 
      fetch(url + '/api/workspaces/' + slug + '/stickies/').then(r => ({ status: r.status, data: r.json().catch(() => ({})) }))
    , { url: BASE_URL, slug: WORKSPACE_SLUG });
    if (stickiesData.status === 200) {
      pass('Stickies API (accessible)');
    } else {
      fail('Stickies API', stickiesData.status);
    }
    
    // === QUICK LINKS APIs ===
    section('Quick Links APIs');
    
    const quickLinksData = await page.evaluate(({ url, slug }) => 
      fetch(url + '/api/workspaces/' + slug + '/quick-links/').then(r => ({ status: r.status, data: r.json() }))
    , { url: BASE_URL, slug: WORKSPACE_SLUG });
    if (quickLinksData.status === 200) {
      pass('Quick links API');
    } else {
      fail('Quick links API', quickLinksData.status);
    }
    
    // === RECENT VISITS APIs ===
    section('Recent Visits APIs');
    
    const recentVisitsData = await page.evaluate(({ url, slug }) => 
      fetch(url + '/api/workspaces/' + slug + '/recent-visits/').then(r => ({ status: r.status, data: r.json() }))
    , { url: BASE_URL, slug: WORKSPACE_SLUG });
    if (recentVisitsData.status === 200) {
      pass('Recent visits API');
    } else {
      fail('Recent visits API', recentVisitsData.status);
    }
    
    // === NOTIFICATIONS APIs ===
    section('Notifications APIs');
    
    const notificationsData = await page.evaluate(({ url, slug }) => 
      fetch(url + '/api/workspaces/' + slug + '/users/notifications/').then(r => ({ status: r.status, data: r.json() }))
    , { url: BASE_URL, slug: WORKSPACE_SLUG });
    if (notificationsData.status === 200) {
      pass('Notifications API');
    } else {
      fail('Notifications API', notificationsData.status);
    }
    
    // === ESTIMATES APIs ===
    section('Estimates APIs');
    
    if (testProjectId) {
      const estimatesData = await page.evaluate(async ({ url, slug, projectId }) => {
        const res = await fetch(url + '/api/workspaces/' + slug + '/projects/' + projectId + '/estimates/');
        return { status: res.status, data: await res.json() };
      }, { url: BASE_URL, slug: WORKSPACE_SLUG, projectId: testProjectId });
      
      if (estimatesData.status === 200) {
        pass('Estimates API');
      } else {
        fail('Estimates API', estimatesData.status);
      }
    }
    
    // === NAVIGATION UI TESTS ===
    section('UI Navigation Tests');
    
    // Navigate to Projects (use URL directly to avoid locale-specific link text)
    await page.goto(BASE_URL + '/' + WORKSPACE_SLUG + '/projects/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    if (page.url().includes('/projects/')) {
      pass('Navigate to Projects page');
    } else {
      fail('Navigate to Projects page', page.url());
    }
    
    // Navigate back to dashboard
    await page.goto(BASE_URL + '/' + WORKSPACE_SLUG + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    if (page.url().includes('/' + WORKSPACE_SLUG + '/')) {
      pass('Navigate to dashboard');
    } else {
      fail('Navigate to dashboard', page.url());
    }
    
    // Navigate to Settings
    await page.goto(BASE_URL + '/' + WORKSPACE_SLUG + '/settings/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    const settingsTitle = await page.title();
    if (settingsTitle.toLowerCase().includes('setting')) {
      pass('Navigate to settings');
    } else {
      fail('Navigate to settings', settingsTitle);
    }
    
    // Navigate to Members settings
    await page.goto(BASE_URL + '/' + WORKSPACE_SLUG + '/settings/members/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    const membersTitle = await page.title();
    if (membersTitle.toLowerCase().includes('member')) {
      pass('Navigate to members settings');
    } else {
      fail('Navigate to members settings', membersTitle);
    }
    
    // === MIXED CONTENT CHECK ===
    section('Mixed Content Check');
    
    const mixedContentErrors = consoleErrors.filter(e => e.includes('Mixed Content'));
    if (mixedContentErrors.length === 0) {
      pass('No mixed content errors');
    } else {
      fail('Mixed content errors found', mixedContentErrors.length);
    }
    
    // === CONSOLE ERRORS CHECK ===
    section('Console Errors Analysis');
    
    // Filter out expected 401/404 errors from API calls
    const criticalErrors = consoleErrors.filter(e => 
      !e.includes('Mixed Content') && 
      !e.includes('Failed to load resource') &&
      !e.includes('401') &&
      !e.includes('404') &&
      !e.includes('403') &&
      !e.includes('sidebar preferences')
    );
    
    if (criticalErrors.length === 0) {
      pass('No critical JS errors');
    } else {
      fail('Critical JS errors', criticalErrors.length + ': ' + criticalErrors[0].substring(0, 80));
    }
    
    // === CLEANUP ===
    section('Cleanup (Delete Test Data)');
    
    // Delete test work item
    if (testWorkItemId && testProjectId) {
      const deleteWorkItem = await page.evaluate(async ({ url, slug, projectId, workItemId }) => {
        const res = await fetch(url + '/api/workspaces/' + slug + '/projects/' + projectId + '/issues/' + workItemId + '/', {
          method: 'DELETE'
        });
        return res.status;
      }, { url: BASE_URL, slug: WORKSPACE_SLUG, projectId: testProjectId, workItemId: testWorkItemId });
      
      if (deleteWorkItem === 204 || deleteWorkItem === 200) {
        pass('Delete test work item');
      } else {
        fail('Delete test work item', deleteWorkItem);
      }
    }
    
    // Delete test cycle
    if (testCycleId && testProjectId) {
      const deleteCycle = await page.evaluate(async ({ url, slug, projectId, cycleId }) => {
        const res = await fetch(url + '/api/workspaces/' + slug + '/projects/' + projectId + '/cycles/' + cycleId + '/', {
          method: 'DELETE'
        });
        return res.status;
      }, { url: BASE_URL, slug: WORKSPACE_SLUG, projectId: testProjectId, cycleId: testCycleId });
      
      if (deleteCycle === 204 || deleteCycle === 200) {
        pass('Delete test cycle');
      } else {
        fail('Delete test cycle', deleteCycle);
      }
    }
    
    // Delete test module
    if (testModuleId && testProjectId) {
      const deleteModule = await page.evaluate(async ({ url, slug, projectId, moduleId }) => {
        const res = await fetch(url + '/api/workspaces/' + slug + '/projects/' + projectId + '/modules/' + moduleId + '/', {
          method: 'DELETE'
        });
        return res.status;
      }, { url: BASE_URL, slug: WORKSPACE_SLUG, projectId: testProjectId, moduleId: testModuleId });
      
      if (deleteModule === 204 || deleteModule === 200) {
        pass('Delete test module');
      } else {
        fail('Delete test module', deleteModule);
      }
    }
    
    // Delete test project
    if (testProjectId) {
      const deleteProject = await page.evaluate(async ({ url, slug, projectId }) => {
        const res = await fetch(url + '/api/workspaces/' + slug + '/projects/' + projectId + '/', {
          method: 'DELETE'
        });
        return res.status;
      }, { url: BASE_URL, slug: WORKSPACE_SLUG, projectId: testProjectId });
      
      if (deleteProject === 204 || deleteProject === 200) {
        pass('Delete test project');
      } else {
        fail('Delete test project', deleteProject);
      }
    }
    
  } catch (e) {
    fail('Test execution', e.message.substring(0, 100));
  }
  
  // === SUMMARY ===
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const pct = Math.round((passed / results.length) * 100);
  console.log('║  ' + passed + '/' + results.length + ' passed (' + pct + '%)                                              ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  
  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => console.log('  • ' + r.test + (r.details ? ': ' + r.details : '')));
  } else {
    console.log('\n========================================');
    console.log('=== ALL TESTS PASSED ===');
    console.log('Plane is fully functional!');
    console.log('========================================');
  }
  
  await browser.close();
  return { passed, failed, total: results.length };
}

runTests().catch(console.error);
