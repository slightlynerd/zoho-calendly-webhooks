const functions = require('firebase-functions');
const axios = require('axios');
axios.defaults.headers.post['content-type'] = 'application/json';
const clientId = functions.config().zoho.client_id;
const clientSecret = functions.config().zoho.client_secret;
const refreshToken = functions.config().zoho.refresh_token;

// create a new lead
function createLead(token, lead) {
  const url = 'https://www.zohoapis.com/crm/v2/Leads';

  return new Promise((resolve, reject) => {
    const data = JSON.stringify(lead);
    axios.post(url, data, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`
      }
    })
      .then((response) => {
        console.log(response.data)
        return resolve(response);
      })
      .catch(e => reject(e))
  })
}
// see if new lead matches leads in crm
function checkLeads(leads, currentLead) {
  return leads.filter(lead => lead.Email === currentLead)
}
// get leads in CRM
function getLeads(token) {
  const url = 'https://www.zohoapis.com/crm/v2/Leads';

  return new Promise((resolve, reject) => {
    axios.get(url, {
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`
      }
    })
      .then((response) => {
        return resolve(response);
      })
      .catch(e => console.log(e))
  })
}
// use refresh token to get access token
function getAccessToken () {
  const url = `https://accounts.zoho.com/oauth/v2/token?refresh_token=${refreshToken}&client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token`;

  return new Promise((resolve, reject) => {
    axios.post(url)
      .then((response) => {
        return resolve(response);
      })
      .catch(e => console.log(e))
  });
}

exports.zohoCrmHook = functions.https.onRequest(async (req, res) => {
  // create a new lead
  const newLead = {
    'data': [
      {
        'Email': payload.invitee.email,
        'Last_Name': payload.invitee.last_name,
        'First_Name': payload.invitee.first_name
      }
    ],
    'trigger': [
      'approval',
      'workflow',
      'blueprint'
    ]
  };
  // get access token
  const { data } = await getAccessToken();
  const accessToken = data.access_token;

  // get the current leads from the CRM
  const leads = await getLeads(accessToken);
  const result = checkLeads(leads.data.data, newLead.data[0].Email);

  if (result.length < 1) {
    return res.json(await createLead(accessToken, newLead));
  }
  else res.json({ message: 'Lead already in CRM' })
});
