# Appstalker v2 To-Do List

1) Discover kişiselleştirme  
   - Yeni `/api/discover/personalized` endpoint (takip edilenlerin uygulamaları, beğeni/kategori sinyalleri, global trending) skor + pagination.  
   - Discover ekranında “For You” feed’i bu endpoint’ten beslensin; hata/empty state mesajları eklensin.  
   - Test: Tamer ile giriş; dummy kurulumu 7 olan Navigator Pro / Design Studio / Focus Blocks önerilerde çıkmalı.
   tüm adımları yaptığın tüm değişiklikleri her an test et. çalışmıyorsa çalışana kadar test et. bana mutlaka çalışabilir halini sun. uygulama çalışır halde olmadan bana çalışıyor test et diye cevap yazma. apk silip yükleyebilir, backendi başlatıp durdurabilirsin. tüm izinleri ve yetkileri sana veriyorum herhangi bir kod değişikliği için bana soru sorma. tüm adımları test ederek doğru çalıştığından emin ol

2) Android izin akışı iyileştirmesi  
   - Native scan öncesi açıklayıcı metin: neden izin, veri kullanımı.  
   - “Devam et” → izin iste; “Atla” → manuel arama akışı; reddedilince crash yok.  
   - Test: İzin reddi/izni kabul; scan ve manuel arama çalışır.
   tüm adımları yaptığın tüm değişiklikleri her an test et. çalışmıyorsa çalışana kadar test et. bana mutlaka çalışabilir halini sun. uygulama çalışır halde olmadan bana çalışıyor test et diye cevap yazma. apk silip yükleyebilir, backendi başlatıp durdurabilirsin. tüm izinleri ve yetkileri sana veriyorum herhangi bir kod değişikliği için bana soru sorma. tüm adımları test ederek doğru çalıştığından emin ol

3) Arama deneyimi  
   - Arama çubuğu daha belirgin; debounce + autocomplete + son aramalar (sil/temizle).  
   - Sonuçlar hem uygulama hem profil (sekme veya karma liste).  
   - Test: Yazarken öneriler; geçmiş arama temizleme; hem app hem profil sonuçları dönmeli.
   tüm adımları yaptığın tüm değişiklikleri her an test et. çalışmıyorsa çalışana kadar test et. bana mutlaka çalışabilir halini sun. uygulama çalışır halde olmadan bana çalışıyor test et diye cevap yazma. apk silip yükleyebilir, backendi başlatıp durdurabilirsin. tüm izinleri ve yetkileri sana veriyorum herhangi bir kod değişikliği için bana soru sorma. tüm adımları test ederek doğru çalıştığından emin ol

4) Etkileşimler (beğeni/yorum)  
   - Feed kartında beğeni/yorum ikonları belirgin + küçük animasyon.  
   - Hızlı yorum ekleme (inline veya mini input), optimistik like/yorum sayacı güncellemesi.  
   - Test: Like toggle sorunsuz; yorum ekle/güncelle; sayılar güncelleniyor.
   tüm adımları yaptığın tüm değişiklikleri her an test et. çalışmıyorsa çalışana kadar test et. bana mutlaka çalışabilir halini sun. uygulama çalışır halde olmadan bana çalışıyor test et diye cevap yazma. apk silip yükleyebilir, backendi başlatıp durdurabilirsin. tüm izinleri ve yetkileri sana veriyorum herhangi bir kod değişikliği için bana soru sorma. tüm adımları test ederek doğru çalıştığından emin ol

5) Logo ve bildirim rozeti  
   - Header’da stilize logo; bildirim ziline unread badge.  
   - Unread count `/notifications`’tan alınsın; okunduğunda sıfırlansın.  
   - Test: Dummy unread ile badge >0; okunduğunda 0.
   tüm adımları yaptığın tüm değişiklikleri her an test et. çalışmıyorsa çalışana kadar test et. bana mutlaka çalışabilir halini sun. uygulama çalışır halde olmadan bana çalışıyor test et diye cevap yazma. apk silip yükleyebilir, backendi başlatıp durdurabilirsin. tüm izinleri ve yetkileri sana veriyorum herhangi bir kod değişikliği için bana soru sorma. tüm adımları test ederek doğru çalıştığından emin ol

6) Boş durumlar (empty states)  
   - Following boş: “Daha fazla kişiyi takip et” CTA; Trending boş: “Uygulama listesi oluştur” CTA; Manage Apps boş: “Cihazı Tara” veya “Ara” CTA.  
   - CTA’lar doğru navigasyon yapmalı.  
   - Test: Boş ekranları tetikle, CTA navigasyonlarını doğrula.
   tüm adımları yaptığın tüm değişiklikleri her an test et. çalışmıyorsa çalışana kadar test et. bana mutlaka çalışabilir halini sun. uygulama çalışır halde olmadan bana çalışıyor test et diye cevap yazma. apk silip yükleyebilir, backendi başlatıp durdurabilirsin. tüm izinleri ve yetkileri sana veriyorum herhangi bir kod değişikliği için bana soru sorma. tüm adımları test ederek doğru çalıştığından emin ol

