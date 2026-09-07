let currentGuild = null;

document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
});

async function checkAuth() {
  try {
    const response = await fetch('/api/user');
    if (response.ok) {
      const user = await response.json();
      loadDashboard(user);
    } else {
      showLoginSection();
    }
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    showLoginSection();
  }
}

function showLoginSection() {
  document.getElementById('loginSection').classList.remove('hidden');
  document.getElementById('dashboardSection').classList.add('hidden');
}

async function loadDashboard(user) {
  document.getElementById('loginSection').classList.add('hidden');
  document.getElementById('dashboardSection').classList.remove('hidden');

  // Mostrar info do usuário
  const userInfo = document.getElementById('userInfo');
  userInfo.innerHTML = `
    <img src="${user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}` : ''}" alt="Avatar">
    <span>${user.username}</span>
    <a href="/logout" style="color: var(--text); text-decoration: none;">Sair</a>
  `;

  // Carregar servidores
  const response = await fetch('/api/guilds');
  const guilds = await response.json();
  loadGuildsList(guilds);
}

function loadGuildsList(guilds) {
  const guildsList = document.getElementById('guildsList');
  guildsList.innerHTML = '';

  guilds.forEach(guild => {
    const guildItem = document.createElement('div');
    guildItem.className = 'guild-item';
    guildItem.onclick = () => selectGuild(guild);
    
    const icon = guild.icon 
      ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}`
      : 'https://discord.com/assets/dd4dbc0016779df1378e7812eabaa04d.png';
    
    guildItem.innerHTML = `
      <img src="${icon}" alt="${guild.name}">
      <span>${guild.name}</span>
    `;
    
    guildsList.appendChild(guildItem);
  });
}

async function selectGuild(guild) {
  currentGuild = guild;
  
  // Atualizar UI
  document.querySelectorAll('.guild-item').forEach(item => {
    item.classList.remove('active');
  });
  event.currentTarget.classList.add('active');

  document.getElementById('welcomePage').classList.add('hidden');
  document.getElementById('guildPage').classList.remove('hidden');

  // Carregar dados
  document.getElementById('guildName').textContent = guild.name;
  const guildIcon = document.getElementById('guildIcon');
  guildIcon.src = guild.icon 
    ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}`
    : 'https://discord.com/assets/dd4dbc0016779df1378e7812eabaa04d.png';

  loadGuildStats();
  loadGuildSettings();
}

async function loadGuildStats() {
  try {
    const response = await fetch(`/api/guild/${currentGuild.id}/stats`);
    const data = await response.json();

    const stats = data.stats || { raids_detected: 0, members_banned: 0, members_kicked: 0 };
    document.getElementById('raidDetected').textContent = stats.raids_detected || 0;
    document.getElementById('membersBanned').textContent = stats.members_banned || 0;
    document.getElementById('membersKicked').textContent = stats.members_kicked || 0;

    // Carregar logs
    const logsList = document.getElementById('logsList');
    logsList.innerHTML = '';
    
    if (data.logs && data.logs.length > 0) {
      data.logs.forEach(log => {
        const logItem = document.createElement('div');
        logItem.className = 'log-item';
        logItem.innerHTML = `
          <strong>${log.action.toUpperCase()}</strong> - ${log.reason}
          <br><small>${new Date(log.timestamp).toLocaleString('pt-BR')}</small>
        `;
        logsList.appendChild(logItem);
      });
    } else {
      logsList.innerHTML = '<p>Nenhum log registrado</p>';
    }
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
  }
}

async function loadGuildSettings() {
  try {
    const response = await fetch(`/api/guild/${currentGuild.id}/settings`);
    const settings = await response.json();

    if (settings) {
      document.getElementById('raidThreshold').value = settings.raid_threshold || 5;
      document.getElementById('timeWindow').value = settings.time_window || 10;
      document.getElementById('action').value = settings.action || 'ban';
    }
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
  }
}

document.getElementById('settingsForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    raid_threshold: parseInt(document.getElementById('raidThreshold').value),
    time_window: parseInt(document.getElementById('timeWindow').value),
    action: document.getElementById('action').value
  };

  try {
    const response = await fetch(`/api/guild/${currentGuild.id}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      alert('Configurações salvas com sucesso!');
    }
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    alert('Erro ao salvar configurações');
  }
});
