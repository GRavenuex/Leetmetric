document.addEventListener("DOMContentLoaded", function () {
  const searchButton = document.getElementById("search-btn");
  const userNameInput = document.getElementById("user-input");
  const errorMessage = document.getElementById("error-message");

  const dashboard = document.getElementById("dashboard");

  const profileName = document.getElementById("profile-name");
  const profileRank = document.getElementById("profile-rank");
  const avatarLetter = document.getElementById("avatar-letter");

  const totalSolved = document.getElementById("total-solved");
  const acceptanceRate = document.getElementById("acceptance-rate");
  const contribution = document.getElementById("contribution");
  const reputation = document.getElementById("reputation");

  const easyProgressCircle = document.querySelector(".easy-progress");
  const mediumProgressCircle = document.querySelector(".medium-progress");
  const hardProgressCircle = document.querySelector(".hard-progress");

  const easyLabel = document.getElementById("easy-label");
  const mediumLabel = document.getElementById("medium-label");
  const hardLabel = document.getElementById("hard-label");

  const submissionTable = document.getElementById("submission-table");

  const themeBtn = document.getElementById("theme-btn");
  const historyList = document.getElementById("history-list");

  const compareBtn = document.getElementById("compare-btn");
  const compareResult = document.getElementById("compare-result");

  let difficultyChart = null;

  function validateUsername(username) {
    if (username.trim() === "") {
      showError("Username should not be empty");
      return false;
    }

    const regex = /^[a-zA-Z][a-zA-Z0-9_]{2,20}$/;

    if (!regex.test(username)) {
      showError("Invalid username format");
      return false;
    }

    hideError();
    return true;
  }

  function showError(message) {
    errorMessage.textContent = message;
  }

  function hideError() {
    errorMessage.textContent = "";
  }

  async function fetchUserDetails(username) {
    try {
      searchButton.textContent = "Searching...";
      searchButton.disabled = true;
      hideError();

      const url = `https://leetcode-api-faisalshohag.vercel.app/${username}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("User not found");
      }

      const data = await response.json();

      if (!data || data.errors) {
        throw new Error("No data found");
      }

      displayUserData(username, data);
      saveSearchHistory(username);

    } catch (error) {
      showError("No data found. Please check username.");
      dashboard.classList.add("hidden");
    } finally {
      searchButton.textContent = "Search";
      searchButton.disabled = false;
    }
  }

  function updateProgress(solved, total, label, circle) {
    solved = solved || 0;
    total = total || 1;

    const percent = Math.round((solved / total) * 100);

    circle.style.setProperty("--progress-degree", `${percent}%`);
    label.textContent = `${solved}/${total}`;
  }

  function displayUserData(username, data) {
    dashboard.classList.remove("hidden");

    const easySolved = data.easySolved || 0;
    const mediumSolved = data.mediumSolved || 0;
    const hardSolved = data.hardSolved || 0;

    const totalEasy = data.totalEasy || 0;
    const totalMedium = data.totalMedium || 0;
    const totalHard = data.totalHard || 0;

    const solvedTotal = data.totalSolved || easySolved + mediumSolved + hardSolved;
    const totalQuestions = data.totalQuestions || totalEasy + totalMedium + totalHard;

    profileName.textContent = username;
    avatarLetter.textContent = username.charAt(0).toUpperCase();

    profileRank.textContent = `Rank: ${data.ranking || "N/A"}`;

    totalSolved.textContent = `${solvedTotal}/${totalQuestions}`;
    contribution.textContent = data.contributionPoint || 0;
    reputation.textContent = data.reputation || 0;

    const totalSubmissions = data.totalSubmissions?.[0]?.submissions || 0;
    const acceptedSubmissions = data.totalSubmissions?.[0]?.count || solvedTotal;

    let rate = 0;

    if (totalSubmissions > 0) {
      rate = Math.round((acceptedSubmissions / totalSubmissions) * 100);
    } else {
      rate = data.acceptanceRate || 0;
    }

    acceptanceRate.textContent = `${rate}%`;

    updateProgress(easySolved, totalEasy, easyLabel, easyProgressCircle);
    updateProgress(mediumSolved, totalMedium, mediumLabel, mediumProgressCircle);
    updateProgress(hardSolved, totalHard, hardLabel, hardProgressCircle);

    createDifficultyChart(easySolved, mediumSolved, hardSolved);
    displayRecentSubmissions(data.recentSubmissions || []);
  }

  function createDifficultyChart(easy, medium, hard) {
    const ctx = document.getElementById("difficultyChart");

    if (difficultyChart !== null) {
      difficultyChart.destroy();
    }

    difficultyChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Easy", "Medium", "Hard"],
        datasets: [
          {
            data: [easy, medium, hard],
            backgroundColor: ["#22c55e", "#f59e0b", "#ef4444"],
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom"
          }
        }
      }
    });
  }

  function displayRecentSubmissions(submissions) {
    submissionTable.innerHTML = "";

    if (!submissions || submissions.length === 0) {
      submissionTable.innerHTML = `
        <tr>
          <td colspan="3">No recent submissions available</td>
        </tr>
      `;
      return;
    }

    submissions.slice(0, 8).forEach((item) => {
      const title = item.title || item.titleSlug || "Unknown Problem";
      const language = item.lang || item.language || "N/A";
      const status = item.statusDisplay || item.status || "N/A";

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${title}</td>
        <td>${language}</td>
        <td>${status}</td>
      `;

      submissionTable.appendChild(row);
    });
  }

  function saveSearchHistory(username) {
    let history = JSON.parse(localStorage.getItem("leetmetric-history")) || [];

    history = history.filter((item) => item !== username);
    history.unshift(username);

    if (history.length > 5) {
      history.pop();
    }

    localStorage.setItem("leetmetric-history", JSON.stringify(history));
    displaySearchHistory();
  }

  function displaySearchHistory() {
    const history = JSON.parse(localStorage.getItem("leetmetric-history")) || [];

    historyList.innerHTML = "";

    if (history.length === 0) {
      historyList.innerHTML = `<p>No recent searches</p>`;
      return;
    }

    history.forEach((username) => {
      const item = document.createElement("button");
      item.className = "history-item";
      item.textContent = username;

      item.addEventListener("click", function () {
        userNameInput.value = username;
        fetchUserDetails(username);
      });

      historyList.appendChild(item);
    });
  }

  async function compareUsers() {
    const user1 = document.getElementById("user1").value.trim();
    const user2 = document.getElementById("user2").value.trim();

    if (!validateUsername(user1) || !validateUsername(user2)) {
      return;
    }

    try {
      compareBtn.textContent = "Comparing...";
      compareBtn.disabled = true;

      const data1 = await fetchUserForCompare(user1);
      const data2 = await fetchUserForCompare(user2);

      showCompareResult(user1, data1, user2, data2);

    } catch (error) {
      compareResult.innerHTML = `<p class="error">Unable to compare users</p>`;
    } finally {
      compareBtn.textContent = "Compare";
      compareBtn.disabled = false;
    }
  }

  async function fetchUserForCompare(username) {
    const url = `https://leetcode-api-faisalshohag.vercel.app/${username}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("User not found");
    }

    return await response.json();
  }

  function showCompareResult(user1, data1, user2, data2) {
    const solved1 = data1.totalSolved || 0;
    const solved2 = data2.totalSolved || 0;

    const winner1 = solved1 > solved2 ? "winner" : "";
    const winner2 = solved2 > solved1 ? "winner" : "";

    compareResult.innerHTML = `
      <div class="compare-card ${winner1}">
        <h3>${user1}</h3>
        <p>Total Solved: ${solved1}</p>
        <p>Easy: ${data1.easySolved || 0}</p>
        <p>Medium: ${data1.mediumSolved || 0}</p>
        <p>Hard: ${data1.hardSolved || 0}</p>
        <p>Rank: ${data1.ranking || "N/A"}</p>
      </div>

      <div class="compare-card ${winner2}">
        <h3>${user2}</h3>
        <p>Total Solved: ${solved2}</p>
        <p>Easy: ${data2.easySolved || 0}</p>
        <p>Medium: ${data2.mediumSolved || 0}</p>
        <p>Hard: ${data2.hardSolved || 0}</p>
        <p>Rank: ${data2.ranking || "N/A"}</p>
      </div>
    `;
  }

  searchButton.addEventListener("click", function () {
    const username = userNameInput.value.trim();

    if (validateUsername(username)) {
      fetchUserDetails(username);
    }
  });

  userNameInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      searchButton.click();
    }
  });

  compareBtn.addEventListener("click", compareUsers);

  themeBtn.addEventListener("click", function () {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
      themeBtn.textContent = "☀️ Light";
      localStorage.setItem("leetmetric-theme", "dark");
    } else {
      themeBtn.textContent = "🌙 Dark";
      localStorage.setItem("leetmetric-theme", "light");
    }
  });

  function loadTheme() {
    const theme = localStorage.getItem("leetmetric-theme");

    if (theme === "dark") {
      document.body.classList.add("dark");
      themeBtn.textContent = "☀️ Light";
    }
  }

  loadTheme();
  displaySearchHistory();
});