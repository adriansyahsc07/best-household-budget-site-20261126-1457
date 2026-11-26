// HematRumah — perender tampilan.
// Setiap fungsi hematView* menerima state { bulan, filterKat, tambahan } dan
// mengembalikan string HTML untuk <main>. Angka selalu dihitung dari
// HEMAT_DATA + transaksi tambahan sesi ini, jadi formulir tambah transaksi
// mengubah semua total di semua tampilan.

const HEMAT = window.HEMAT_DATA;
const HEMAT_NAMA_BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const HEMAT_NAMA_BULAN_PANJANG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function hematRp(nilai) {
  const negatif = nilai < 0;
  const digit = String(Math.abs(Math.round(nilai)));
  let hasil = '';
  for (let i = 0; i < digit.length; i++) {
    if (i > 0 && (digit.length - i) % 3 === 0) hasil += '.';
    hasil += digit[i];
  }
  return (negatif ? '−Rp ' : 'Rp ') + hasil;
}

function hematTanggal(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return d + ' ' + HEMAT_NAMA_BULAN[m - 1] + ' ' + y;
}

function hematTanggalPanjang(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return d + ' ' + HEMAT_NAMA_BULAN_PANJANG[m - 1] + ' ' + y;
}

function hematEsc(teks) {
  return String(teks).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function hematKategori(id) {
  return HEMAT.kategori.find((k) => k.id === id);
}

function hematTransaksiBulan(state, kunci) {
  const dasar = HEMAT.bulan[kunci].transaksi;
  const ekstra = state.tambahan[kunci] || [];
  return dasar.concat(ekstra);
}

function hematRingkasanBulan(state, kunci) {
  const b = HEMAT.bulan[kunci];
  const pemasukan = b.pemasukan.reduce((s, p) => s + p.jumlah, 0);
  const perKat = {};
  let totalTerpakai = 0;
  for (const t of hematTransaksiBulan(state, kunci)) {
    perKat[t.kat] = (perKat[t.kat] || 0) + t.jumlah;
    totalTerpakai += t.jumlah;
  }
  const totalBatas = Object.values(b.batas).reduce((s, v) => s + v, 0);
  return {
    pemasukan,
    perKat,
    totalTerpakai,
    totalBatas,
    sisa: pemasukan - totalTerpakai,
    rasioTabungan: pemasukan > 0 ? ((pemasukan - totalTerpakai) / pemasukan) * 100 : 0,
  };
}

function hematStatus(persen) {
  if (persen > 100) return { label: 'Lewat', kelas: 'lewat' };
  if (persen >= 75) return { label: 'Waspada', kelas: 'waspada' };
  return { label: 'Aman', kelas: 'aman' };
}

function hematBarisKategori(state, kunci, ringkas) {
  const b = HEMAT.bulan[kunci];
  const r = hematRingkasanBulan(state, kunci);
  return HEMAT.kategori.map((kat) => {
    const batas = b.batas[kat.id];
    const pakai = r.perKat[kat.id] || 0;
    const persen = batas > 0 ? (pakai / batas) * 100 : 0;
    const st = hematStatus(persen);
    const lebar = Math.min(100, persen);
    return (
      '<div class="kat-baris">' +
      '<div class="kat-kepala"><span class="kat-nama"><i class="titik" style="background:' + kat.warna + '"></i>' + kat.nama + '</span>' +
      '<span class="kat-angka">' + hematRp(pakai) + ' <em>dari</em> ' + hematRp(batas) + '</span></div>' +
      '<div class="rel"><div class="isi ' + st.kelas + '" style="width:' + lebar.toFixed(1) + '%"></div></div>' +
      (ringkas ? '' : '<div class="kat-meta"><span>' + persen.toFixed(0) + '% terpakai</span><span class="lencana ' + st.kelas + '">' + st.label + '</span></div>') +
      '</div>'
    );
  }).join('');
}

function hematViewRingkasan(state) {
  const kunci = state.bulan;
  const b = HEMAT.bulan[kunci];
  const r = hematRingkasanBulan(state, kunci);
  const persenBatas = (r.totalTerpakai / r.totalBatas) * 100;
  const bermasalah = HEMAT.kategori
    .map((kat) => ({ kat, persen: ((r.perKat[kat.id] || 0) / b.batas[kat.id]) * 100 }))
    .filter((x) => x.persen >= 75)
    .sort((a, c) => c.persen - a.persen);
  const catatan = bermasalah.length
    ? bermasalah.map((x) => x.kat.nama + ' ' + x.persen.toFixed(0) + '%').join(', ')
    : 'tidak ada kategori yang mendekati batas';
  const belumLunas = b.tagihan.filter((t) => !t.lunas);
  const totalBelum = belumLunas.reduce((s, t) => s + t.jumlah, 0);

  const kartu =
    '<section class="grid-kartu">' +
    '<article class="kartu sorot"><h3>Pemasukan ' + b.label + '</h3><p class="angka-besar">' + hematRp(r.pemasukan) + '</p><p class="ket">' + b.pemasukan.length + ' sumber pemasukan tercatat</p></article>' +
    '<article class="kartu"><h3>Total terpakai</h3><p class="angka-besar">' + hematRp(r.totalTerpakai) + '</p><p class="ket">' + persenBatas.toFixed(0) + '% dari total batas anggaran ' + hematRp(r.totalBatas) + '</p></article>' +
    '<article class="kartu"><h3>Sisa bulan ini</h3><p class="angka-besar">' + hematRp(r.sisa) + '</p><p class="ket">Belum termasuk tagihan belum lunas ' + hematRp(totalBelum) + '</p></article>' +
    '<article class="kartu"><h3>Rasio tabungan</h3><p class="angka-besar">' + r.rasioTabungan.toFixed(1).replace('.', ',') + '%</p><p class="ket">Target keluarga 20% dari pemasukan</p></article>' +
    '</section>';

  const kesehatan =
    '<section class="panel"><h2>Kesehatan anggaran</h2>' +
    '<p>Bulan ini keluarga memakai <strong>' + hematRp(r.totalTerpakai) + '</strong> dari batas total <strong>' + hematRp(r.totalBatas) + '</strong> (' + persenBatas.toFixed(0) + '%). ' +
    'Yang perlu diperhatikan: ' + hematEsc(catatan) + '. ' +
    (belumLunas.length ? 'Masih ada <strong>' + belumLunas.length + ' tagihan belum lunas</strong> senilai ' + hematRp(totalBelum) + ', terdekat ' + hematEsc(belumLunas[0].nama) + ' pada ' + hematTanggal(belumLunas[0].jatuhTempo) + '.' : 'Semua tagihan bulan ini sudah lunas.') +
    '</p></section>';

  const strip = belumLunas.length
    ? '<section class="panel"><h2>Tagihan berikutnya</h2><div class="strip-tagihan">' +
      belumLunas.map((t) => '<div class="chip-tagihan"><strong>' + hematEsc(t.nama) + '</strong><span>' + hematTanggal(t.jatuhTempo) + '</span><span>' + hematRp(t.jumlah) + '</span></div>').join('') +
      '</div></section>'
    : '';

  const sumber =
    '<section class="panel"><h2>Sumber pemasukan</h2><ul class="daftar-baris">' +
    b.pemasukan.map((p) => '<li><span>' + hematEsc(p.sumber) + ' <em>(' + hematTanggal(p.tanggal) + ')</em></span><strong>' + hematRp(p.jumlah) + '</strong></li>').join('') +
    '</ul></section>';

  const tren =
    '<section class="panel"><h2>Tren enam bulan</h2><canvas id="grafik-tren" class="grafik-tren" height="240"></canvas>' +
    '<p class="legenda"><span><i class="titik" style="background:#2e7d4f"></i>Pemasukan</span><span><i class="titik" style="background:#c2571b"></i>Pengeluaran</span></p></section>';

  return (
    '<h1 class="judul-halaman">Ringkasan ' + b.label + '</h1>' +
    '<p class="subjudul">Keuangan ' + HEMAT.keluarga + ', ' + HEMAT.kota + ' — semua angka bulan terpilih, diperbarui setiap ada transaksi baru.</p>' +
    kartu + tren + kesehatan +
    '<section class="panel"><h2>Pengeluaran per kategori</h2>' + hematBarisKategori(state, kunci, true) + '</section>' +
    strip + sumber
  );
}

function hematViewAnggaran(state) {
  const kunci = state.bulan;
  const b = HEMAT.bulan[kunci];
  const r = hematRingkasanBulan(state, kunci);
  const kartu = HEMAT.kategori.map((kat) => {
    const batas = b.batas[kat.id];
    const pakai = r.perKat[kat.id] || 0;
    const persen = (pakai / batas) * 100;
    const st = hematStatus(persen);
    const sisa = batas - pakai;
    return (
      '<article class="kartu kat-kartu">' +
      '<div class="kat-kepala"><span class="kat-nama"><i class="titik" style="background:' + kat.warna + '"></i>' + kat.nama + '</span><span class="lencana ' + st.kelas + '">' + st.label + '</span></div>' +
      '<p class="angka-sedang">' + hematRp(pakai) + '</p>' +
      '<div class="rel"><div class="isi ' + st.kelas + '" style="width:' + Math.min(100, persen).toFixed(1) + '%"></div></div>' +
      '<p class="ket">Batas ' + hematRp(batas) + ' · ' + persen.toFixed(0) + '% terpakai · ' +
      (sisa >= 0 ? 'sisa ' + hematRp(sisa) : 'kelebihan ' + hematRp(-sisa)) + '</p></article>'
    );
  }).join('');
  return (
    '<h1 class="judul-halaman">Anggaran per kategori</h1>' +
    '<p class="subjudul">' + b.label + ' — total batas ' + hematRp(r.totalBatas) + ', terpakai ' + hematRp(r.totalTerpakai) + ' (' + ((r.totalTerpakai / r.totalBatas) * 100).toFixed(0) + '%). Status: Aman di bawah 75%, Waspada 75–100%, Lewat di atas batas.</p>' +
    '<section class="grid-kartu">' + kartu + '</section>'
  );
}

function hematViewTransaksi(state) {
  const kunci = state.bulan;
  const b = HEMAT.bulan[kunci];
  const semua = hematTransaksiBulan(state, kunci).slice().sort((a, c) => (a.tanggal < c.tanggal ? 1 : -1));
  const tampil = state.filterKat === 'semua' ? semua : semua.filter((t) => t.kat === state.filterKat);
  const totalTampil = tampil.reduce((s, t) => s + t.jumlah, 0);

  const opsiFilter =
    '<option value="semua"' + (state.filterKat === 'semua' ? ' selected' : '') + '>Semua kategori</option>' +
    HEMAT.kategori.map((k) => '<option value="' + k.id + '"' + (state.filterKat === k.id ? ' selected' : '') + '>' + k.nama + '</option>').join('');
  const opsiForm = HEMAT.kategori.map((k) => '<option value="' + k.id + '">' + k.nama + '</option>').join('');

  const baris = tampil.map((t) => {
    const kat = hematKategori(t.kat);
    return '<tr><td>' + hematTanggal(t.tanggal) + '</td><td>' + hematEsc(t.item) + '</td><td><i class="titik" style="background:' + kat.warna + '"></i>' + kat.nama + '</td><td class="kanan">' + hematRp(t.jumlah) + '</td></tr>';
  }).join('');

  return (
    '<h1 class="judul-halaman">Transaksi</h1>' +
    '<p class="subjudul">Log pengeluaran ' + b.label + '. Tambah transaksi lewat formulir — total di Ringkasan dan Anggaran ikut berubah.</p>' +
    '<section class="panel"><h2>Tambah transaksi</h2>' +
    '<form id="form-transaksi" class="form-transaksi">' +
    '<label>Tanggal<input type="date" name="tanggal" value="' + kunci + '-26" required></label>' +
    '<label>Keperluan<input type="text" name="item" placeholder="mis. Belanja pasar mingguan" required maxlength="60"></label>' +
    '<label>Kategori<select name="kat">' + opsiForm + '</select></label>' +
    '<label>Jumlah (Rp)<input type="number" name="jumlah" min="1000" step="500" placeholder="150000" required></label>' +
    '<button type="submit" class="tombol">Tambah</button>' +
    '</form><p class="ket" id="form-catatan">Transaksi baru masuk ke bulan ' + b.label + ' dan tersimpan selama halaman dibuka.</p></section>' +
    '<section class="panel"><div class="baris-alat"><h2>Log pengeluaran</h2>' +
    '<label class="saring">Tampilkan <select id="saring-kat">' + opsiFilter + '</select></label></div>' +
    '<div class="bungkus-tabel"><table class="tabel"><thead><tr><th>Tanggal</th><th>Keperluan</th><th>Kategori</th><th class="kanan">Jumlah</th></tr></thead>' +
    '<tbody>' + (baris || '<tr><td colspan="4">Tidak ada transaksi pada kategori ini.</td></tr>') + '</tbody>' +
    '<tfoot><tr><td colspan="3">Total tampil (' + tampil.length + ' transaksi)</td><td class="kanan">' + hematRp(totalTampil) + '</td></tr></tfoot></table></div></section>'
  );
}

function hematViewTagihan(state) {
  const kunci = state.bulan;
  const b = HEMAT.bulan[kunci];
  const daftar = b.tagihan.slice().sort((a, c) => (a.jatuhTempo < c.jatuhTempo ? -1 : 1));
  const belum = daftar.filter((t) => !t.lunas);
  const totalBelum = belum.reduce((s, t) => s + t.jumlah, 0);
  const totalSemua = daftar.reduce((s, t) => s + t.jumlah, 0);
  const baris = daftar.map((t) =>
    '<tr><td>' + hematEsc(t.nama) + '</td><td>' + hematTanggalPanjang(t.jatuhTempo) + '</td><td class="kanan">' + hematRp(t.jumlah) + '</td>' +
    '<td><span class="lencana ' + (t.lunas ? 'aman' : 'waspada') + '">' + (t.lunas ? 'Lunas' : 'Belum dibayar') + '</span></td></tr>'
  ).join('');
  return (
    '<h1 class="judul-halaman">Tagihan berulang</h1>' +
    '<p class="subjudul">' + b.label + ' — ' + daftar.length + ' tagihan senilai ' + hematRp(totalSemua) + '; yang belum dibayar ' + hematRp(totalBelum) +
    (belum.length ? ', terdekat ' + hematEsc(belum[0].nama) + ' pada ' + hematTanggal(belum[0].jatuhTempo) : '') + '.</p>' +
    '<section class="panel"><div class="bungkus-tabel"><table class="tabel"><thead><tr><th>Tagihan</th><th>Jatuh tempo</th><th class="kanan">Jumlah</th><th>Status</th></tr></thead><tbody>' + baris + '</tbody></table></div>' +
    '<p class="ket">Tagihan dibayar dari rekening utama paling lambat sehari sebelum jatuh tempo agar tidak kena denda keterlambatan.</p></section>'
  );
}

function hematViewTujuan(state) {
  const r = hematRingkasanBulan(state, state.bulan);
  const kartu = HEMAT.tujuan.map((t) => {
    const persen = (t.terkumpul / t.target) * 100;
    const sisa = t.target - t.terkumpul;
    const bulanLagi = Math.ceil(sisa / t.setoran);
    return (
      '<article class="kartu tujuan-kartu"><h3>' + hematEsc(t.nama) + '</h3>' +
      '<p class="angka-sedang">' + hematRp(t.terkumpul) + '</p>' +
      '<div class="rel"><div class="isi aman" style="width:' + persen.toFixed(1) + '%"></div></div>' +
      '<p class="ket">' + persen.toFixed(0) + '% dari target ' + hematRp(t.target) + ' · sisa ' + hematRp(sisa) + '</p>' +
      '<p>' + hematEsc(t.keterangan) + '</p>' +
      '<p class="ket">Setoran rutin ' + hematRp(t.setoran) + '/bulan · perkiraan tercapai ' + hematEsc(t.targetBulan) + ' (' + bulanLagi + ' bulan lagi dengan setoran saat ini)</p></article>'
    );
  }).join('');
  const totalTarget = HEMAT.tujuan.reduce((s, t) => s + t.target, 0);
  const totalKumpul = HEMAT.tujuan.reduce((s, t) => s + t.terkumpul, 0);
  return (
    '<h1 class="judul-halaman">Tujuan tabungan</h1>' +
    '<p class="subjudul">Tiga tujuan berjalan: terkumpul ' + hematRp(totalKumpul) + ' dari total target ' + hematRp(totalTarget) + '. Sisa bulan terpilih saat ini ' + hematRp(r.sisa) + ' — sebagian dialirkan ke setoran tujuan di awal bulan berikutnya.</p>' +
    '<section class="grid-kartu satu">' + kartu + '</section>'
  );
}

function hematViewPanduan() {
  const artikel = HEMAT.panduan.map((p, i) =>
    '<article class="panel panduan-item"><h2>' + (i + 1) + '. ' + hematEsc(p.judul) + '</h2><p>' + hematEsc(p.isi) + '</p></article>'
  ).join('');
  return (
    '<h1 class="judul-halaman">Panduan anggaran rumah tangga</h1>' +
    '<p class="subjudul">Enam kebiasaan yang dipakai keluarga kami sendiri — singkat, praktis, dan semuanya bisa mulai dilakukan bulan ini juga.</p>' +
    artikel
  );
}

// Pasang perilaku halaman Transaksi setelah HTML-nya dimuat ke <main>.
function hematPasangTransaksi(state, render) {
  const saring = document.getElementById('saring-kat');
  if (saring) {
    saring.addEventListener('change', () => {
      state.filterKat = saring.value;
      render();
    });
  }
  const form = document.getElementById('form-transaksi');
  if (form) {
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const fd = new FormData(form);
      const jumlah = Number(fd.get('jumlah'));
      const item = String(fd.get('item') || '').trim();
      const tanggal = String(fd.get('tanggal') || '');
      const kat = String(fd.get('kat') || 'lainnya');
      if (!item || !tanggal || !(jumlah > 0)) return;
      if (!state.tambahan[state.bulan]) state.tambahan[state.bulan] = [];
      state.tambahan[state.bulan].push({ tanggal, item, kat, jumlah });
      render();
    });
  }
}
