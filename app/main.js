// HematRumah — perute hash dan pengawatan halaman.
// State sesi: bulan terpilih, saringan kategori, dan transaksi yang ditambah
// lewat formulir (tersimpan di memori selama halaman dibuka). Setiap render
// menggambar ulang tampilan aktif dari data + state, lalu memasang perilaku
// khusus tampilan itu (grafik tren, formulir, saringan).

const hematState = {
  bulan: window.HEMAT_DATA.bulanAktif,
  filterKat: 'semua',
  tambahan: {},
};

const HEMAT_RUTE = {
  ringkasan: hematViewRingkasan,
  anggaran: hematViewAnggaran,
  transaksi: hematViewTransaksi,
  tagihan: hematViewTagihan,
  tujuan: hematViewTujuan,
  panduan: hematViewPanduan,
};

function hematRuteAktif() {
  const mentah = window.location.hash.replace(/^#\/?/, '').split('/')[0];
  return Object.prototype.hasOwnProperty.call(HEMAT_RUTE, mentah) ? mentah : 'ringkasan';
}

function hematRender() {
  const rute = hematRuteAktif();
  const main = document.getElementById('konten');
  main.innerHTML = HEMAT_RUTE[rute](hematState);

  document.querySelectorAll('.navigasi a').forEach((a) => {
    a.classList.toggle('aktif', a.getAttribute('data-rute') === rute);
  });

  if (rute === 'ringkasan') {
    const kanvas = document.getElementById('grafik-tren');
    if (kanvas) hematGambarTren(kanvas, window.HEMAT_DATA.tren);
  }
  if (rute === 'transaksi') {
    hematPasangTransaksi(hematState, hematRender);
  }
  window.scrollTo(0, 0);
}

function hematSiapkanPemilihBulan() {
  const pilih = document.getElementById('pilih-bulan');
  const data = window.HEMAT_DATA;
  pilih.innerHTML = data.urutanBulan
    .map((k) => '<option value="' + k + '"' + (k === hematState.bulan ? ' selected' : '') + '>' + data.bulan[k].label + '</option>')
    .join('');
  pilih.addEventListener('change', () => {
    hematState.bulan = pilih.value;
    hematRender();
  });
}

window.addEventListener('hashchange', hematRender);
hematSiapkanPemilihBulan();
hematRender();
