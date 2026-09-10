const GRAPH_VERSION = 'v20.0';
const LEAD_ACTION_TYPES = new Set([
  'lead',
  'onsite_conversion.lead',
  'offsite_conversion.fb_pixel_lead',
  'complete_registration'
]);

function json(res, status, body) {
  res.status(status).json(body);
}

function getDateRange(query) {
  const today = new Date();
  const end = query.date_end || today.toISOString().slice(0, 10);
  if (query.date_start && query.date_end) return { since: query.date_start, until: query.date_end };

  const days = Number(query.days || 7);
  const start = new Date(today);
  start.setDate(today.getDate() - Math.max(days - 1, 0));
  return { since: start.toISOString().slice(0, 10), until: end };
}

function getLeadCount(actions = []) {
  return actions
    .filter((action) => LEAD_ACTION_TYPES.has(action.action_type))
    .reduce((total, action) => total + Number(action.value || 0), 0);
}

function getCostPerLead(row, leads) {
  const leadCost = (row.cost_per_action_type || []).find((action) => LEAD_ACTION_TYPES.has(action.action_type));
  return Number(leadCost?.value || (leads ? Number(row.spend || 0) / leads : 0));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

  const token = process.env.META_ACCESS_TOKEN;
  const configuredAccounts = process.env.META_AD_ACCOUNTS;
  if (!token || !configuredAccounts) {
    return json(res, 503, { error: 'Meta is not configured', demo: true });
  }

  let accounts;
  try {
    accounts = JSON.parse(configuredAccounts);
  } catch {
    return json(res, 500, { error: 'META_AD_ACCOUNTS must be valid JSON' });
  }

  const requestedAccount = req.query.account;
  const account = accounts.find((item) => item.name === requestedAccount) || accounts[0];
  if (!account?.id) return json(res, 400, { error: 'No advertising account configured' });

  const params = new URLSearchParams({
    access_token: token,
    level: 'campaign',
    fields: 'campaign_name,campaign_id,impressions,spend,actions,cost_per_action_type',
    time_range: JSON.stringify(getDateRange(req.query)),
    limit: '500'
  });

  try {
    const response = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${account.id}/insights?${params}`);
    const payload = await response.json();
    if (!response.ok || payload.error) return json(res, response.status || 502, { error: payload.error?.message || 'Meta API request failed' });

    const campaigns = (payload.data || []).map((row) => {
      const leads = getLeadCount(row.actions);
      return {
        name: row.campaign_name || 'Campaña sin nombre',
        conversion: 'Captación de leads',
        impressions: Number(row.impressions || 0),
        leads,
        cpl: getCostPerLead(row, leads),
        spend: Number(row.spend || 0),
        symbol: '↗',
        tone: ''
      };
    });

    const totals = campaigns.reduce((sum, campaign) => ({
      impressions: sum.impressions + campaign.impressions,
      leads: sum.leads + campaign.leads,
      spend: sum.spend + campaign.spend
    }), { impressions: 0, leads: 0, spend: 0 });

    return json(res, 200, {
      source: 'meta',
      account: account.name,
      range: getDateRange(req.query),
      campaigns,
      totals: { ...totals, cpl: totals.leads ? totals.spend / totals.leads : 0 }
    });
  } catch (error) {
    return json(res, 502, { error: error.message || 'Could not reach Meta API' });
  }
};
