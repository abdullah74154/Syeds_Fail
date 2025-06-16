async function uploadImage() {
  const file = document.getElementById("fileInput").files[0];
  const status = document.getElementById("status");

  if (!file) {
    alert("⚠️ ছবি সিলেক্ট করুন");
    return;
  }

  status.innerText = "⏳ আপলোড হচ্ছে...";

  const reader = new FileReader();
  reader.onload = async function () {
    const base64 = reader.result.split(',')[1];

    // Step 1: Upload to Imgbb
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: "POST",
      body: new URLSearchParams({ image: base64 })
    });

    const data = await res.json();

    if (!data.success) {
      status.innerText = "❌ ছবি Imgbb-তে যায়নি";
      return;
    }

    const imgURL = data.data.display_url;
    status.innerHTML = `✅ আপলোড হয়েছে: <a href="${imgURL}" target="_blank">ছবি দেখুন</a>`;

    // Step 2: Read old JSON
    const oldRes = await fetch(JSON_FILE_URL);
    const oldRaw = await oldRes.text();
    let images = [];

    try {
      images = JSON.parse(oldRaw);
    } catch {
      images = [];
    }

    images.push(imgURL);

    const newContent = JSON.stringify(images, null, 2);
    const commitMessage = "Added new image";

    const API_UPLOAD_URL = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${JSON_FILE_NAME}`;

    // Step 3: Get SHA of current file
    const metaRes = await fetch(API_UPLOAD_URL, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`
      }
    });
    const meta = await metaRes.json();
    const sha = meta.sha;

    // Step 4: Push new content
    const updateRes = await fetch(API_UPLOAD_URL, {
      method: "PUT",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: commitMessage,
        content: btoa(unescape(encodeURIComponent(newContent))),
        sha: sha
      })
    });

    if (updateRes.ok) {
      status.innerText += "\n📁 JSON আপডেট সফল ✅";
      loadGallery();
    } else {
      status.innerText += "\n❌ JSON আপডেট ব্যর্থ";
    }
  }

  reader.readAsDataURL(file);
}

// Load Gallery from JSON file
async function loadGallery() {
  const container = document.getElementById("gallery");
  container.innerHTML = "";

  try {
    const res = await fetch(JSON_FILE_URL);
    const json = await res.json();

    json.reverse().forEach(link => {
      const div = document.createElement("div");
      div.className = "image-box";
      div.innerHTML = `<img src="${link}"><br><a href="${link}" target="_blank">🔗</a>`;
      container.appendChild(div);
    });
  } catch (err) {
    container.innerText = "❌ ছবি লোড হয়নি";
  }
}

window.onload = loadGallery;
