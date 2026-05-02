const apiKey = "bb_sk_e766645558ad3cea9a16c60fa571352778b4714d";
const endpoint = "https://api.butterbase.ai/mcp";

async function testMcp() {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Butterbase-Key": apiKey
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "listTools",
        params: {}
      })
    });

    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

testMcp();
