async function test() {
  const url = "https://api.imarouter.com/v1/videos";
  const apiKey = "sk-4CGsjnhjuHN0nEXtsKmgg1UrT3HNShxpCqYhUUxZpBT0mnDU";
  try {
    const res = await fetch(url, { 
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "seedance-2.0",
        prompt: "A test video of a museum",
      })
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Body:", JSON.stringify(data));
  } catch (err) {
    console.error("Error:", err.message);
  }
}
test();
