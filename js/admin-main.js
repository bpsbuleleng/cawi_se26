// ══════════════════════════════════════════════
// PASSWORD KUESIONER
// ══════════════════════════════════════════════

function initPage() {
  // Status kuesioner
  if (_kuesionerHash && _kuesionerHash !== DEFAULT_PW_HASH) {
    document.getElementById('pwSourceLabel').innerHTML = 'Password Kustom <span class="badge badge-custom">Kustom</span>';
    document.getElementById('pwHashLabel').textContent = _kuesionerHash;
  } else {
    document.getElementById('pwSourceLabel').innerHTML = 'Password Default <span class="badge badge-default">Default</span>';
    document.getElementById('pwHashLabel').textContent = DEFAULT_PW_HASH;
  }
  // Status admin
  document.getElementById('adminPwStatusLabel').innerHTML = (_adminHash && _adminHash !== ADMIN_DEFAULT_HASH)
    ? 'Password Kustom <span class="badge badge-custom">Kustom</span>'
    : 'Password Default <span class="badge badge-default">Default</span>';

  initSheetCard();
  initPegawaiCard();
}

// ── Strength meter helper ──
function passwordStrength(pw) {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

function applyStrength(pw, barId, lblId) {
  const bar = document.getElementById(barId);
  const lbl = document.getElementById(lblId);
  if (!pw) { bar.style.width = '0'; lbl.textContent = ''; return; }
  const s = passwordStrength(pw);
  const colors = ['#ef5350','#ff7043','#ffa726','#66bb6a','#43a047'];
  const labels = ['Sangat lemah','Lemah','Cukup','Kuat','Sangat kuat'];
  bar.style.width = Math.min(100, s * 20) + '%';
  bar.style.background = colors[s - 1] || '#eee';
  lbl.textContent = pw.length < 8 ? 'Minimal 8 karakter' : (labels[s - 1] || '');
  lbl.style.color = colors[s - 1] || '#999';
}

// ══════════════════════════════════════════════
// UBAH PASSWORD KUESIONER
// ══════════════════════════════════════════════
async function onNewPwInput() {
  const pw = document.getElementById('newPw').value;
  applyStrength(pw, 'strengthBar', 'strengthLabel');
  const preview = document.getElementById('hashPreview');
  if (pw.length >= 8) {
    preview.style.display = 'block';
    preview.textContent = await sha256(pw);
  } else {
    preview.style.display = 'none';
  }
  updateSaveBtn();
}

function updateSaveBtn() {
  const pw  = document.getElementById('newPw').value;
  const cpw = document.getElementById('confirmPw').value;
  document.getElementById('btnSave').disabled = !(pw.length >= 8 && pw === cpw);
}

async function saveNewPassword() {
  const pw  = document.getElementById('newPw').value;
  const cpw = document.getElementById('confirmPw').value;
  hideAlerts();
  if (pw.length < 8) { showAlert('alertErr', 'Password minimal 8 karakter.'); return; }
  if (pw !== cpw)    { showAlert('alertErr', 'Konfirmasi password tidak cocok.'); return; }

  const hash = await sha256(pw);
  try {
    const res = await fetch(getScriptUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'setConfig', key: 'kuesioner_pw_hash', value: hash })
    });
    const d = await res.json();
    if (d.status !== 'ok') throw new Error(d.message || 'Gagal menyimpan');
  } catch(e) {
    showAlert('alertErr', 'Gagal menyimpan: ' + e.message);
    return;
  }
  _kuesionerHash = hash;

  document.getElementById('newPw').value = '';
  document.getElementById('confirmPw').value = '';
  document.getElementById('hashPreview').style.display = 'none';
  document.getElementById('strengthBar').style.width = '0';
  document.getElementById('strengthLabel').textContent = '';
  document.getElementById('btnSave').disabled = true;
  initPage();
  showAlert('alertOk', null);
}

async function resetToDefault() {
  hideAlerts();
  try {
    const res = await fetch(getScriptUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'setConfig', key: 'kuesioner_pw_hash', value: DEFAULT_PW_HASH })
    });
    const d = await res.json();
    if (d.status !== 'ok') throw new Error(d.message || 'Gagal reset');
  } catch(e) {
    showAlert('alertErr', 'Gagal reset: ' + e.message);
    return;
  }
  _kuesionerHash = DEFAULT_PW_HASH;
  initPage();
  document.getElementById('alertReset').style.display = 'block';
  setTimeout(() => { document.getElementById('alertReset').style.display = 'none'; }, 4000);
}

// ══════════════════════════════════════════════
// UBAH PASSWORD ADMIN
// ══════════════════════════════════════════════
function onNewAdminPwInput() {
  applyStrength(document.getElementById('newAdminPw').value, 'adminStrengthBar', 'adminStrengthLabel');
  updateSaveAdminBtn();
}

function updateSaveAdminBtn() {
  const pw  = document.getElementById('newAdminPw').value;
  const cpw = document.getElementById('confirmAdminPw').value;
  document.getElementById('btnSaveAdmin').disabled = !(pw.length >= 8 && pw === cpw);
}

async function saveAdminPassword() {
  const cur = document.getElementById('curAdminPw').value;
  const pw  = document.getElementById('newAdminPw').value;
  const cpw = document.getElementById('confirmAdminPw').value;

  hideAdminAlerts();

  if (!cur) { showAdminAlert('alertAdminErr', 'Masukkan password admin saat ini untuk verifikasi.'); return; }
  const curHash = await sha256(cur);
  if (curHash !== _adminHash) { showAdminAlert('alertAdminErr', 'Password admin saat ini salah.'); return; }
  if (pw.length < 8) { showAdminAlert('alertAdminErr', 'Password baru minimal 8 karakter.'); return; }
  if (pw !== cpw)    { showAdminAlert('alertAdminErr', 'Konfirmasi password tidak cocok.'); return; }

  const hash = await sha256(pw);
  try {
    const res = await fetch(getScriptUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'setConfig', key: 'admin_pw_hash', value: hash })
    });
    const d = await res.json();
    if (d.status !== 'ok') throw new Error(d.message || 'Gagal menyimpan');
  } catch(e) {
    showAdminAlert('alertAdminErr', 'Gagal menyimpan: ' + e.message);
    return;
  }
  _adminHash = hash;

  document.getElementById('curAdminPw').value = '';
  document.getElementById('newAdminPw').value = '';
  document.getElementById('confirmAdminPw').value = '';
  document.getElementById('adminStrengthBar').style.width = '0';
  document.getElementById('adminStrengthLabel').textContent = '';
  document.getElementById('btnSaveAdmin').disabled = true;
  initPage();
  showAdminAlert('alertAdminOk', null);
}

async function resetAdminToDefault() {
  hideAdminAlerts();
  try {
    const res = await fetch(getScriptUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'setConfig', key: 'admin_pw_hash', value: ADMIN_DEFAULT_HASH })
    });
    const d = await res.json();
    if (d.status !== 'ok') throw new Error(d.message || 'Gagal reset');
  } catch(e) {
    showAdminAlert('alertAdminErr', 'Gagal reset: ' + e.message);
    return;
  }
  _adminHash = ADMIN_DEFAULT_HASH;
  initPage();
  document.getElementById('alertAdminReset').style.display = 'block';
  setTimeout(() => { document.getElementById('alertAdminReset').style.display = 'none'; }, 4000);
}

let showingAdminPw = false;
function toggleShowAdminPw() {
  showingAdminPw = !showingAdminPw;
  ['curAdminPw','newAdminPw','confirmAdminPw'].forEach(id => {
    document.getElementById(id).type = showingAdminPw ? 'text' : 'password';
  });
}

function showAlert(id, msg) {
  const el = document.getElementById(id);
  if (msg) el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

function hideAlerts() {
  ['alertOk','alertErr','alertReset'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
}

function showAdminAlert(id, msg) { showAlert(id, msg); }

function hideAdminAlerts() {
  ['alertAdminOk','alertAdminErr','alertAdminReset'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
}

let showingPw = false;
function toggleShowPw() {
  showingPw = !showingPw;
  ['newPw','confirmPw'].forEach(id => {
    document.getElementById(id).type = showingPw ? 'text' : 'password';
  });
}

// ══════════════════════════════════════════════
// SUMBER GOOGLE SHEET
// ══════════════════════════════════════════════

function initSheetCard() {
  const custom = localStorage.getItem(SHEET_URL_KEY);
  document.getElementById('sheetSourceLabel').innerHTML = custom
    ? 'URL Kustom <span class="badge badge-custom">Kustom</span>'
    : 'URL Default <span class="badge badge-default">Default</span>';
  document.getElementById('sheetUrlLabel').textContent = custom || DEFAULT_SCRIPT_URL;
}

function updateSaveSheetBtn() {
  const val = document.getElementById('newSheetUrl').value.trim();
  document.getElementById('btnSaveSheet').disabled = !val.startsWith('https://');
}

function saveSheetUrl() {
  const val = document.getElementById('newSheetUrl').value.trim();
  if (!val.startsWith('https://')) {
    showSheetAlert('alertSheetErr', '❌ URL tidak valid. Harus dimulai dengan https://');
    return;
  }
  localStorage.setItem(SHEET_URL_KEY, val);
  document.getElementById('newSheetUrl').value = '';
  document.getElementById('btnSaveSheet').disabled = true;
  initSheetCard();
  showSheetAlert('alertSheetOk', '✅ URL Google Sheet berhasil disimpan.');
}

function resetSheetUrl() {
  localStorage.removeItem(SHEET_URL_KEY);
  initSheetCard();
  showSheetAlert('alertSheetOk', '✅ URL direset ke default.');
}

function showSheetAlert(id, msg) {
  ['alertSheetOk','alertSheetErr'].forEach(x => { document.getElementById(x).style.display = 'none'; });
  const el = document.getElementById(id);
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

// ══════════════════════════════════════════════
// DAFTAR PEGAWAI
// ══════════════════════════════════════════════
// Sumber: master/pegawai.json
const PEGAWAI_KEY = 'cawi_pegawai_override';

let pegawaiList = [];
let editingIdx  = -1;

async function initPegawaiCard() {
  const raw = localStorage.getItem(PEGAWAI_KEY);
  if (raw) {
    pegawaiList = JSON.parse(raw);
  } else {
    try {
      const res = await fetch('master/pegawai.json');
      pegawaiList = (await res.json()).map(p => ({...p}));
    } catch(e) { pegawaiList = []; }
  }
  const isCustom = !!raw;
  document.getElementById('pegawaiSourceLabel').innerHTML = isCustom
    ? 'Daftar Kustom <span class="badge badge-custom">Kustom</span>'
    : 'Daftar Default <span class="badge badge-default">Default</span>';
  document.getElementById('pegawaiCountLabel').textContent = pegawaiList.length + ' pegawai';
  renderPegawaiTable();
}

function renderPegawaiTable() {
  const tbody = document.getElementById('pegawaiTbody');
  if (!pegawaiList.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#aaa;padding:20px">Belum ada data pegawai</td></tr>';
    return;
  }
  tbody.innerHTML = pegawaiList.map((p, i) => `
    <tr>
      <td style="font-weight:600">${p.nama}</td>
      <td style="font-family:monospace;font-size:.78rem;color:#555">${p.nip || '—'}</td>
      <td style="font-size:.82rem;color:#666">${p.jabatan || '—'}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-outline" style="padding:4px 10px;font-size:.76rem;flex:none" onclick="editPegawai(${i})">Edit</button>
        <button class="btn btn-danger"  style="padding:4px 10px;font-size:.76rem;flex:none;margin-left:4px" onclick="deletePegawai(${i})">Hapus</button>
      </td>
    </tr>
  `).join('');
}

function editPegawai(i) {
  editingIdx = i;
  const p = pegawaiList[i];
  document.getElementById('pgNama').value    = p.nama;
  document.getElementById('pgNip').value     = p.nip;
  document.getElementById('pgJabatan').value = p.jabatan;
  document.getElementById('pgFormTitle').textContent   = 'Edit Pegawai';
  document.getElementById('btnSavePg').textContent     = 'Simpan Perubahan';
  document.getElementById('btnCancelPg').style.display = 'inline-flex';
  document.getElementById('pgForm').scrollIntoView({behavior:'smooth', block:'nearest'});
}

function cancelEditPegawai() {
  editingIdx = -1;
  document.getElementById('pgNama').value    = '';
  document.getElementById('pgNip').value     = '';
  document.getElementById('pgJabatan').value = '';
  document.getElementById('pgFormTitle').textContent   = 'Tambah Pegawai Baru';
  document.getElementById('btnSavePg').textContent     = 'Tambah';
  document.getElementById('btnCancelPg').style.display = 'none';
}

function savePegawai() {
  const nama    = document.getElementById('pgNama').value.trim();
  const nip     = document.getElementById('pgNip').value.trim();
  const jabatan = document.getElementById('pgJabatan').value.trim();
  if (!nama) { showPgAlert('alertPgErr', '❌ Nama pegawai harus diisi.'); return; }
  const isEdit = editingIdx >= 0;
  if (isEdit) {
    pegawaiList[editingIdx] = {nama, nip, jabatan};
  } else {
    pegawaiList.push({nama, nip, jabatan});
  }
  localStorage.setItem(PEGAWAI_KEY, JSON.stringify(pegawaiList));
  cancelEditPegawai();
  initPegawaiCard();
  showPgAlert('alertPgOk', isEdit ? '✅ Data pegawai berhasil diperbarui.' : '✅ Pegawai baru berhasil ditambahkan.');
}

function deletePegawai(i) {
  if (!confirm('Hapus "' + pegawaiList[i].nama + '" dari daftar?')) return;
  pegawaiList.splice(i, 1);
  localStorage.setItem(PEGAWAI_KEY, JSON.stringify(pegawaiList));
  initPegawaiCard();
}

function resetPegawai() {
  if (!confirm('Reset daftar pegawai ke data default? Semua perubahan akan hilang.')) return;
  localStorage.removeItem(PEGAWAI_KEY);
  cancelEditPegawai();
  initPegawaiCard();
  showPgAlert('alertPgOk', '✅ Daftar pegawai direset ke default.');
}

function showPgAlert(id, msg) {
  ['alertPgOk','alertPgErr'].forEach(x => { document.getElementById(x).style.display = 'none'; });
  const el = document.getElementById(id);
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}
