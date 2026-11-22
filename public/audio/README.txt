=== COMO ADICIONAR ÁUDIOS REAIS DOS CARROS NO APEX TCG ===

O motor de áudio híbrido (src/utils/engineAudio.js) carrega automaticamente gravações reais
(.mp3, .wav ou .ogg), aplica loop contínuo com crossfade sem estalo e varia o pitch (playbackRate)
em tempo real conforme você acelera e troca de marcha!

ORDEM DE PRIORIDADE:
1. Áudio enviado pela interface (botão "Carregar Áudio Real" no Inspetor 3D -> salvo no IndexedDB)
2. Áudio específico do carro em:  public/audio/cars/<id-do-carro>.mp3
3. Áudio da família do motor em:  public/audio/engines/<tipo-motor>.mp3
4. Fallback automático: sintetizador físico em tempo real.

EXEMPLOS DE NOMES PARA CARROS ESPECÍFICOS (public/audio/cars/):
- bmw-m3-e46.mp3
- f1-ferrari-f2004.mp3
- f1-mclaren-mp4-4.mp3
- f1-lotus-97t.mp3
- f1-williams-fw14b.mp3
- f1-redbull-rb19.mp3
- skyline-gtr-r34.mp3
- toyota-supra-mk4.mp3
- mazda-rx7-fd.mp3
- ferrari-f40.mp3
- bugatti-chiron-ss.mp3

EXEMPLOS DE NOMES POR FAMÍLIA DE MOTOR (public/audio/engines/):
- f1-v10.mp3        (Ferrari F2004, Williams FW14B, Carrera GT)
- f1-v6-turbo.mp3   (McLaren MP4/4, Lotus 97T)
- f1-v6-hybrid.mp3  (Red Bull RB19)
- i6-turbo.mp3      (Skyline GT-R R34, Supra MK4)
- rotary.mp3        (Mazda RX-7 FD)
- boxer.mp3         (Subaru Impreza 22B STi)
- muscle-v8.mp3     (Mustang GT 67, Dodge Charger 70)
- v8.mp3            (BMW M3 GTR, Ferrari F40, Koenigsegg Jesko)
- flat6.mp3         (Porsche 911 GT3 RS)
- v12.mp3           (McLaren F1, Pagani Zonda R)
- w16.mp3           (Bugatti Chiron)
- v6.mp3            (Honda NSX-R)
- i4.mp3            (Civic Type R, Golf GTI, Miata, Lancer Evo IX)

DICA: Os melhores arquivos são recortes de 1,5s a 3s do motor em aceleração constante (sem fala ou música).
