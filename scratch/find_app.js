const apiKey = "bb_sk_e766645558ad3cea9a16c60fa571352778b4714d";
const baseUrl = "https://api.butterbase.ai";

async function findApp() {
  try {
    const response = await fetch(`${baseUrl}/v1/apps`, {
      headers: {
        "X-Butterbase-Key": apiKey
      }
    });

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

findApp();
