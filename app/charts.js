// HematRumah — gambar grafik di kanvas.
// Satu-satunya grafik kanvas situs ini: tren pemasukan vs pengeluaran enam
// bulan sebagai batang berpasangan. Batang kategori dan tujuan memakai
// elemen HTML/CSS di views.js, bukan kanvas.

function hematSiapkanKanvas(canvas) {
  const rasio = window.devicePixelRatio || 1;
  const lebar = canvas.clientWidth;
  const tinggi = canvas.clientHeight;
  canvas.width = Math.round(lebar * rasio);
  canvas.height = Math.round(tinggi * rasio);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(rasio, 0, 0, rasio, 0, 0);
  return { ctx, lebar, tinggi };
}

function hematJutaan(nilai) {
  const jt = nilai / 1000000;
  return (Math.round(jt * 10) / 10).toString().replace('.', ',') + ' jt';
}

// tren: [{ bulan, pemasukan, pengeluaran }] — batang hijau pemasukan,
// batang terakota pengeluaran, label bulan di bawah, nilai di atas batang.
function hematGambarTren(canvas, tren) {
  const { ctx, lebar, tinggi } = hematSiapkanKanvas(canvas);
  const padKiri = 8;
  const padAtas = 22;
  const padBawah = 24;
  const areaTinggi = tinggi - padAtas - padBawah;
  const maks = Math.max.apply(null, tren.map((t) => Math.max(t.pemasukan, t.pengeluaran))) * 1.08;

  ctx.clearRect(0, 0, lebar, tinggi);

  // garis dasar
  ctx.strokeStyle = '#d8c9b8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padKiri, padAtas + areaTinggi);
  ctx.lineTo(lebar - 4, padAtas + areaTinggi);
  ctx.stroke();

  const slot = (lebar - padKiri - 8) / tren.length;
  const lebarBatang = Math.min(26, slot * 0.3);

  tren.forEach((t, i) => {
    const tengah = padKiri + slot * i + slot / 2;
    const pasangan = [
      { nilai: t.pemasukan, warna: '#2e7d4f', x: tengah - lebarBatang - 3 },
      { nilai: t.pengeluaran, warna: '#c2571b', x: tengah + 3 },
    ];
    pasangan.forEach((b) => {
      const h = (b.nilai / maks) * areaTinggi;
      ctx.fillStyle = b.warna;
      ctx.beginPath();
      ctx.roundRect(b.x, padAtas + areaTinggi - h, lebarBatang, h, [4, 4, 0, 0]);
      ctx.fill();
      ctx.fillStyle = '#5f5142';
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(hematJutaan(b.nilai), b.x + lebarBatang / 2, padAtas + areaTinggi - h - 5);
    });
    ctx.fillStyle = '#5f5142';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t.bulan, tengah, tinggi - 8);
  });
}
