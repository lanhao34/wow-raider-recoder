const CLIENT_ID = 'a156eaab-d3b1-40b8-9273-b3fb73009677';
const CLIENT_SECRET = 'lDXbdY3JClt79iSYfJhltFwQtiaGBe6Yor9Ked8j';
const REPORT_CODE = 'mqLBPGYdZ97RJAxT';

async function run() {
  const authString = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const tokenRes = await fetch('https://www.warcraftlogs.com/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const token = (await tokenRes.json()).access_token;

  const query = `
    query {
      reportData {
        report(code: "${REPORT_CODE}") {
          fights(killType: Kills) {
            id
            name
            encounterID
          }
        }
      }
    }
  `;

  const res = await fetch('https://www.warcraftlogs.com/api/v2/client', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });
  const data = await res.json();
  console.log(JSON.stringify(data.data.reportData.report.fights, null, 2));
}
run();
