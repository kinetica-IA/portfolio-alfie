/* Datos del método de pranayama (extraídos de pranayama.html) */
(function(){
"use strict";
const TECNICAS = [
  { id: "conciencia", n: 0, nombre: "Toma de conciencia del aliento", sub: "Acortar y suavizar el aliento", nivel: "Inicial", semana: 1, ref: "pp. 40–41, 159",
    para: "Puerta de entrada de toda sesión: aquieta la atención y prepara la concentración. El autor propone 5 minutos al amanecer o al atardecer {p:41}.",
    postura: "Sentado, columna recta y vertical, cabeza equilibrada, inmóvil {p:40}.",
    pasos: [
      "Siéntate y relájate. Observa el aliento entrar y salir, sin modificarlo {p:40}.",
      "Inspira completo y profundo: siente el aire en las fosas nasales, la garganta y el pecho {p:40}.",
      "Al espirar, frena el aire que sale: cada vez más silencioso, suave y lento, sin dejar de ser profundo {p:40}.",
      "Sin pausa entre inspiración y espiración; como mucho, un corte de un segundo {p:41}.",
      "Opcional: repite OM cinco veces en voz alta y después solo mentalmente {p:40}.",
      "Para terminar, recorre el camino inverso: OM mental, OM audible, respiración normal {p:41}."
    ],
    ritmo: "Libre, sin retención. Metrónomo: 4 : 0 : 6 : 0 s durante 3–5 min {C}.",
    duracion: "2–5 minutos al inicio de cada sesión {p:159}.",
    errores: ["Dormirse: un «incidente técnico» que hay que evitar {p:41}.", "Forzar la lentitud hasta que falte el aire {C}."],
    precauciones: ["El libro añade una retención con pulmones vacíos y dice que «no hay ningún riesgo» {p:41}. En el método se omite al principio y después se hace solo breve y cómoda {C}."],
    profesor: ["Guía con voz lenta y pocas palabras.", "Una palma humedecida bajo la nariz deja sentir la «longitud» del aliento {p:40}.", "Si alguien se duerme, invita a abrir los ojos y enderezar la espalda."],
    metro: "conciencia/base" },
  { id: "completa", n: 1, nombre: "Respiración yóguica completa", sub: "Con control de la cintura abdominal", nivel: "Inicial", semana: 1, ref: "pp. 73–80",
    para: "Base de todas las técnicas y de la respiración diaria: coordina abdomen, costillas y clavículas {p:75}.",
    postura: "Loto, Siddhasana, Vajrasana o silla baja, con la espalda recta. Con la espalda curvada es casi imposible {p:78}.",
    pasos: [
      "Vacía los pulmones a fondo cerrando el abdomen al final {p:78}.",
      "Coloca un índice entre el ombligo y el pubis, y el otro entre el ombligo y el esternón {p:78}.",
      "Inspira despacio: la zona bajo el ombligo se mantiene firme; solo cede un poco la zona de arriba {p:78}.",
      "Sigue abriendo las costillas hacia los lados {p:78}.",
      "Termina elevando ligeramente la zona bajo las clavículas {p:78}.",
      "Espira en orden inverso y cierra el abdomen al final para vaciar del todo {p:75}."
    ],
    ritmo: "Espiración el doble que la inspiración {p:62}. Metrónomo: 4 : 0 : 8 : 0 s {C}.",
    duracion: "5 minutos; después, base de cada técnica.",
    errores: ["Inflar el vientre «como un balón» {p:78}.", "Confundir control con contracción: un abdomen rígido da una respiración alta y ansiosa {p:79}.", "Respirar solo con el pecho {p:79}."],
    precauciones: ["Al principio es normal algo de cansancio abdominal {p:77}.", "Quien tenga el abdomen muy tenso debe aprender antes a relajarlo {p:79}."],
    profesor: ["Haz primero el «ensayo incorrecto» (vientre que se hincha) para que el alumno compare {p:78}.", "Comprobación táctil: el maestro del autor presionaba con los pulgares encima del pubis {p:77}. Pide permiso antes de tocar {C}.", "Indicación verbal: «firme abajo, suave arriba»."],
    metro: "completa/base" },
  { id: "nadi", n: 2, nombre: "Nadi Sodhana", sub: "Respiración alternada sin retención", nivel: "Inicial", semana: 1, ref: "pp. 47–49",
    para: "Equilibrar el paso del aire por ambas fosas e igualar inspiración y espiración. Prepara las demás técnicas {p:47}.",
    postura: "Columna recta, actitud relajada, ojos cerrados {p:48}. Mano derecha: índice y medio doblados; el pulgar tapa la fosa derecha; anular y meñique, la izquierda. Presiona con la yema, nunca con la uña, en la parte blanda bajo el hueso nasal {p:48}. Apoya el codo contra el pecho {p:49}.",
    pasos: [
      "Espira lenta y completamente por ambas fosas {p:48}.",
      "Tapa la derecha e inspira lento y silencioso por la izquierda {p:48}.",
      "Tapa ambas fosas 1–2 segundos: «¡ni uno más!» {p:48}.",
      "Destapa la derecha y espira a fondo por la derecha {p:48}.",
      "Inspira por la derecha {p:48}.",
      "Tapa ambas un segundo y espira por la izquierda {p:48}.",
      "Continúa la secuencia: inspira por el mismo lado por el que acabas de espirar {p:48}."
    ],
    ritmo: "Al principio solo lento; cuando sea familiar, inspiración = espiración {p:49}. Metrónomo: 4 : 1 : 4 : 0 por lado, indicando la fosa {C}.",
    duracion: "Tanto como quieras sin fatiga; el mismo tiempo que la toma de conciencia {p:49}.",
    errores: ["Crispar ojos, frente, labios o mentón {p:49}.", "Apretar los dientes {p:49}.", "Retener más de 1–2 segundos {p:48}."],
    precauciones: ["Con una fosa muy obstruida no se puede hacer: destápala antes (ver técnicas de apoyo) {p:48}."],
    evidencia: "Las respiraciones lentas, incluida la alternada, se asocian a pequeñas bajadas de la tensión y del pulso {E:3,5}. Los resultados específicos de la respiración alternada son poco consistentes {E:5}.",
    profesor: ["Al principio la atención se va a los dedos: es normal {p:48}.", "Si el brazo se cansa, codo sobre un cojín o cambio de mano {C}.", "En grupo, marca en voz alta «izquierda / derecha» las primeras rondas."],
    metro: "nadi/inicio" },
  { id: "ritmada", n: 3, nombre: "Respiración ritmada", sub: "Y completamente ritmada (1:2:2 → 1:4:2)", nivel: "Inicial-medio", semana: 4, ref: "pp. 61–64",
    para: "Sincronizar el aliento con el latido. El ritmo absorbe la atención e induce calma {p:63}.",
    postura: "La de pranayama, con la columna recta.",
    pasos: [
      "A. Espera a que la respiración se regule sola y percibe el latido, o tómate el pulso {p:62}.",
      "Inspira en 2 latidos y espira en 4, durante un minuto {p:62}.",
      "Si es cómodo, pasa a 3 : 6 y después a 4 : 8 {p:63}.",
      "B. Con respiración completa, introduce una retención breve: inspira 1, retén 2, espira 2 (por ejemplo 4 : 8 : 8) {p:63}.",
      "Con la práctica, ritmo clásico 1 : 4 : 2 (4 : 16 : 8) {p:63}. Con más de 10 s de retención, usa Jalandhara {p:59}."
    ],
    ritmo: "A: 2:4 → 3:6 → 4:8. B: 4:8:8 (suave 4:4:8 {C}) → 4:16:8.",
    duracion: "La que permite continuar «casi indefinidamente y sin fatiga» {p:63}.",
    errores: ["Tomar la duración como objetivo {p:63}.", "Introducir la retención antes de que el ritmo esté asentado {p:63}."],
    precauciones: ["Aplica las reglas de la retención: debes poder espirar despacio y volver a inspirar con calma {p:58}."],
    evidencia: "La respiración lenta se asocia a bajadas modestas de la tensión y del pulso {E:3,4}.",
    profesor: ["En el PDF, «la respiración dura el doble de la inspiración» {p:62} es una errata: se refiere a la espiración.", "Pide a quien no perciba el latido que use el pulso de la muñeca o la unidad del metrónomo."],
    metro: "ritmada/3-6" },
  { id: "ujjayi", n: 7, nombre: "Ujjayi simple", sub: "Respiración con la glotis entrecerrada", nivel: "Inicial-medio", semana: 5, ref: "pp. 112–116",
    para: "Un cierre parcial de la glotis frena el aire y produce un sonido suave y continuo que sostiene la atención {p:112}.",
    postura: "Siddhasana, medio Loto o Loto; Vajrasana para principiantes. Dorso de las manos sobre las rodillas, en Gnana Mudra {p:112}.",
    pasos: [
      "Cierra suavemente la glotis, como contrayendo la base del cuello {p:112}.",
      "Inspira lento con control abdominal hasta llenar, sobre todo el pecho {p:113}.",
      "Retén 2 segundos, no más {p:113}.",
      "Espira con el mismo sonido, al menos el doble de tiempo, vaciando con el abdomen {p:113}.",
      "Retén 2 segundos con los pulmones vacíos y vuelve a empezar {p:113}."
    ],
    ritmo: "1 : (2 s) : 2 : (2 s). Metrónomo: 4 : 2 : 8 : 2 s.",
    duracion: "Ciclos de 10 respiraciones, 4–5 ciclos, 5–10 minutos; después, 2–3 minutos de Shavasana {p:113}. Más adelante, 15–20 minutos {p:115}.",
    errores: ["Que suene como un ronquido o con las cuerdas vocales {p:112}.", "Frenar el aire en la nariz en vez de en la glotis {p:114}.", "Curvar la espalda {p:113}."],
    precauciones: ["Sin retención y tumbado con las piernas elevadas, el libro la considera adecuada incluso para personas con problemas cardiacos {p:115}.", "Purna Ujjayi, con retención larga, queda fuera del método {p:113}."],
    profesor: ["Para encontrar el sonido: espirar por la boca como empañando un espejo y luego cerrar la boca manteniendo la garganta {C}.", "El sonido debe oírse a corta distancia, no en toda la sala."],
    metro: "ujjayi/base" },
  { id: "pranamudra", n: 9, nombre: "Prana Mudra", sub: "Shanti Mudra: respiración con gesto", nivel: "Inicial", semana: 4, ref: "pp. 68–72",
    para: "Respiración completa acompañada de un gesto de brazos y una retención final en actitud abierta {p:69}.",
    postura: "Loto, Siddhasana o Vajrasana; silla como concesión temporal. Manos en el regazo con las palmas hacia arriba {p:69}.",
    pasos: [
      "Termina una espiración completa con el abdomen cerrado; pausa breve con los pulmones vacíos {p:69}.",
      "Fase abdominal: al inspirar, las manos suben delante del vientre, con los dedos hacia él {p:70}.",
      "Fase costal: las manos suben hasta las clavículas; los codos se separan {p:70}.",
      "Fase clavicular: las manos pasan frente a la garganta y la cara, y los brazos se abren con las palmas hacia arriba y al frente {p:70}.",
      "Retén cómodamente, con el cuello y los brazos relajados {p:70}.",
      "Toma un poco de aire y espira en orden inverso mientras las manos vuelven al regazo {p:70}.",
      "Repite al menos 5 veces seguidas {p:72}."
    ],
    ritmo: "Libre. Metrónomo: 6 : 4 : 8 : 3 s {C}.",
    duracion: "Al menos 5 repeticiones; buena para cerrar la sesión.",
    errores: ["Gesto torpe o con tirones {p:72}.", "Rigidez en muñecas y dedos {p:71}."],
    precauciones: ["Con los hombros limitados, abre los brazos solo hasta donde no haya tensión {C}."],
    profesor: ["Enseña primero el gesto frente a un espejo, después la atención y por último el OM {p:72}.", "El autor pide practicarla a solas y solo admite la práctica en grupo para aprenderla en un curso {p:72}: en clase se aprende y se recomienda practicarla en casa."],
    metro: "pranamudra/base" },
  { id: "recarga", n: 8, nombre: "Recarga pránica", sub: "Ejercicio de atención con imágenes", nivel: "Inicial", semana: 6, ref: "pp. 81–83",
    para: "Ejercicio de atención: se imagina la entrada del aire como luz, se reúne la atención en el centro del cuerpo y se la «reparte» al espirar. El autor lo ve como antesala de la meditación {p:83}. Se puede hacer tumbado {p:83}.",
    postura: "Sentado con la columna recta, o tumbado {p:81}.",
    pasos: [
      "Inspira lenta y completamente, con la atención en la entrada del aire por la nariz; imagina una luz {p:81}.",
      "Retén suavemente, con la atención entre el esternón y el ombligo. Añade Jalandhara y Mula Bandha solo si ya los dominas {p:82}.",
      "Espira largo y controlado, imaginando que la sensación se extiende por todo el cuerpo {p:82}.",
      "Repite unos minutos, con respiraciones normales intercaladas si te cansas {p:82}."
    ],
    ritmo: "Pasa a espirar antes de que la retención resulte incómoda {p:82}. Metrónomo: 4 : 4 : 8 : 0 s {C}.",
    duracion: "Unos minutos, dentro o fuera de la sesión {p:159}.",
    errores: ["Prolongar la retención: la espiración lenta es la protección contra retenciones excesivas {p:82}."],
    precauciones: ["El libro dice «ninguna contraindicación» {p:83}, pero incluye una retención: se aplican las precauciones de retención {C}.", "Las supuestas curaciones (esguince, hígado) del libro no tienen base científica y no forman parte del método."],
    profesor: ["Útil para alumnos que se distraen: la imagen mental sostiene la atención."],
    metro: "recarga/base" },
  { id: "viloma", n: 5, nombre: "Viloma", sub: "Aliento fraccionado", nivel: "Inicial-medio", semana: 8, ref: "pp. 65–67",
    para: "Aprender a retener con retenciones breves y repartidas, fáciles de controlar. El autor lo considera ideal para practicar sin guía {p:66}. El ciclo B ayuda a calmarse por la noche; el ciclo A, a despejarse por la mañana {p:67}.",
    postura: "Sentado; también tumbado o caminando (en ese caso, sin la retención final) {p:65, 67}.",
    pasos: [
      "Ciclo A: inspira 2 latidos, retén 2, inspira 2, retén 2… hasta llenar los pulmones {p:65}.",
      "Retén 5–10 segundos y espira de forma lenta y continua {p:65}.",
      "Haz 5 respiraciones así: es un ciclo A {p:65}.",
      "Ciclo B: inspira de forma continua; espira por etapas: 2 espira, 2 retén… hasta vaciar {p:65}.",
      "Retén 5–10 segundos con los pulmones vacíos e inspira sin interrupción. 5 respiraciones forman un ciclo B {p:65}.",
      "Descansa en Shavasana {p:65}."
    ],
    ritmo: "Etapas siempre de 2 latidos. Se progresa con más etapas (de 3–4 a 8–10), no con etapas más largas {p:66}.",
    duracion: "Un ciclo A y un ciclo B; repetir si no hay fatiga {p:65}.",
    errores: ["Hacer ruido: Viloma es silencioso {p:66}.", "Detenciones bruscas: cierra la glotis con suavidad {p:66}.", "Querer más etapas a toda costa {p:67}."],
    precauciones: ["Personas con problemas cardiacos: abstenerse de las retenciones {p:66}.", "Tras unos días, añade Mula Bandha en cada pausa {p:66}."],
    profesor: ["La espiración (o inspiración) final debe seguir siendo tranquila: es la prueba de que no se ha forzado."],
    metro: "viloma/A3" },
  { id: "anuloma", n: 4, nombre: "Anuloma Viloma", sub: "Respiración alternada con retención", nivel: "Medio", semana: 10, ref: "pp. 60, 63, 159–160",
    para: "Nadi Sodhana con retención: un ejercicio clásico para entrenar retenciones progresivas con seguridad {p:60}.",
    postura: "Como en Nadi Sodhana.",
    pasos: [
      "Espira por la izquierda e inspira por la izquierda {p:60}.",
      "Retén con ambas fosas tapadas {p:60}.",
      "Espira por la derecha e inspira por la derecha {p:60}.",
      "Retén con ambas fosas tapadas {p:60}.",
      "Vuelve a empezar. Con más de 10 s de retención, usa Jalandhara {p:160}."
    ],
    ritmo: "Al principio sin medir la retención {p:159}. Después: 4:4:8 → 4:8:8 → 4:12:8 → 4:16:8 (1:4:2) {p:63}. Opcional y pautado por el profesor: 5:20:10.",
    duracion: "5 minutos o más {p:159}.",
    errores: ["Acelerar la espiración tras la retención: rompe la proporción {p:66}."],
    precauciones: ["Por encima de 20 s de retención, el autor habla de precauciones y contraindicaciones {p:53}. Ver <a href=\"#precauciones\">Precauciones</a>.", "Alternativa suave: Nadi Sodhana."],
    profesor: ["Pauta individualmente la proporción: el criterio es que la inspiración siguiente sea tranquila."],
    metro: "anuloma/112" },
  { id: "cuadrado", n: 6, nombre: "Pranayama cuadrado", sub: "Samavritti: cuatro fases iguales", nivel: "Medio", semana: 12, ref: "pp. 84–87",
    para: "Cuatro fases de igual duración. Si puedes prolongarlo indefinidamente sin fatiga, no estás sobrepasando tu capacidad {p:86}.",
    postura: "Sentado sobre los isquiones. Antes de empezar, recorre la columna con la atención «como un ascensor» {p:84}.",
    pasos: [
      "Vacía a fondo los pulmones sin contar {p:85}.",
      "Retén con los pulmones vacíos 4 OM {p:85}.",
      "Inspira en 4 OM con el abdomen controlado {p:85}.",
      "Retén 4 OM {p:85}.",
      "Espira en 4 OM con el perineo relajado {p:85}.",
      "Repite sin interrupción entre ciclos {p:85}."
    ],
    ritmo: "4 OM para empezar; 6–8 OM es el término medio {p:85}. Cuenta en grupos (OM-OM / OM-OM), no con números {p:84}.",
    duracion: "Mientras la mente acepte concentrarse; para si cansa o aburre {p:86}.",
    errores: ["Hacerlo mecánico {p:86}.", "Adormecerse {p:86}."],
    precauciones: ["Con menos de 4 OM pierde su sentido: haz respiración completa sin retención {p:85}. Alternativa intermedia: 4:2:4:2 {C}."],
    profesor: ["Puedes añadir Asvini Mudra en cada retención, una contracción por OM {p:85}, o hacerlo con sonido Ujjayi {p:86}.", "Errata del PDF: «6 minutos» significa 6 tiempos {p:84}."],
    metro: "cuadrado/4" },
  { id: "kapalabhati", n: 10, nombre: "Kapalabhati", sub: "Expulsiones activas, inspiración pasiva", nivel: "Medio", semana: 11, ref: "pp. 100–108",
    para: "Expulsiones breves y enérgicas con inspiración pasiva: limpia la nariz y entrena el abdomen {p:100–102}. Es una técnica activadora.",
    postura: "Sentado (Siddhasana, Vajrasana, Loto o silla firme), con la columna recta. Nunca tumbado ni de pie {p:100} {C}.",
    pasos: [
      "Llena el tórax y mantenlo inmóvil, con las costillas abiertas {p:100}.",
      "Relaja el abdomen {p:101}.",
      "Contrae brusca y brevemente el bajo vientre hacia la columna: el aire sale con fuerza (unos 0,2 s) {p:101}.",
      "Relaja frenando: el aire entra solo y en silencio {p:101}.",
      "Repite en ráfagas, con descansos de respiración lenta y normal entre ellas {p:102}.",
      "Al terminar, nada de retención: respira lento y normal {p:102}."
    ],
    ritmo: "La inspiración dura al menos el triple que la expulsión {p:102}. 60 expulsiones por minuto {p:101}.",
    duracion: "Progresión: 3 ráfagas de 10 con 30 s de descanso y 10 más cada semana {p:102}, hasta el techo del método: 3 ráfagas de 60 a 60/min. El libro llega a 120.",
    errores: ["Mover el tórax {p:103}.", "Subir los hombros {p:103}.", "Igualar expulsión e inspiración {p:103}.", "Meter el vientre {p:103}.", "Columna doblada {p:103}.", "Sacrificar fuerza por velocidad {p:103}."],
    precauciones: ["Contraindicaciones en <a href=\"#precauciones\">Precauciones</a>: problemas cardiacos, hipertensión, glaucoma, epilepsia, pánico, enfermedad pulmonar, embarazo, hernias.", "Hay un caso documentado de neumotórax por Kapalabhati {E:8}.", "Para si notas mareo u hormigueo."],
    evidencia: "Reduce de forma aguda la variabilidad cardiaca vagal (es activadora, no calmante) {E:6} y no muestra los efectos cardiovasculares de las técnicas lentas {E:4,5}. Las técnicas rápidas concentran más efectos adversos {E:2}.",
    profesor: ["Comprobaciones: las aletas nasales se separan de golpe; los huecos detrás de las clavículas se elevan {p:101}.", "La variante alternada (Kapalabhati II), solo cuando la forma básica sea automática, 2–3 semanas después {p:104, 160}.", "Contradicción del libro: en un lugar exige retención tras Kapalabhati {p:58} y en otro no {p:102}. El método la descarta por el riesgo de perder el conocimiento tras hiperventilar {E:9,10}."],
    metro: "kapalabhati/k10" },
  { id: "bhastrika", n: 11, nombre: "Bhastrika", sub: "El fuelle", nivel: "Medio-avanzado", semana: 19, ref: "pp. 109–111",
    para: "Respiración completa rápida y amplia, más intensa que Kapalabhati, seguida de una retención {p:109}. El libro la considera «uno de los ejercicios más poderosos» {p:110}.",
    postura: "Siddhasana o Loto; Vajrasana tolerado {p:109}; silla firme si hace falta {C}. Nunca de pie, tumbado ni en el agua.",
    pasos: [
      "Requisitos: dominar Kapalabhati, Ujjayi, Jalandhara y Mula Bandha. Nariz despejada {p:109}.",
      "Respira de forma completa, con el abdomen controlado y la glotis en Ujjayi {p:109}.",
      "Acentúa la espiración y acelera sin perder amplitud; máximo 60 respiraciones por minuto {p:109}.",
      "Al principio, como mucho 40 respiraciones; sube a 60 solo si un minuto no produce fatiga {p:109}.",
      "Termina con una inspiración profunda y retén con Jalandhara y Mula Bandha. Retención cómoda, la que pauta el profesor {p:109}.",
      "Toma un poco de aire y espira lentamente y a fondo por la fosa derecha {p:109}.",
      "Descansa con respiración normal antes de otra ronda."
    ],
    ritmo: "Ronda: 20–60 respiraciones a 30–60/min, retención cómoda, espiración lenta y descanso.",
    duracion: "De 1 ronda de 20 (semana 19) hasta 3 rondas de 40–60 si es cómodo (semana 24).",
    errores: ["Sacrificar amplitud por velocidad {p:109}.", "Precipitarse {p:111}.", "Alargar la retención por orgullo: el límite es cómodo, no el máximo."],
    precauciones: ["El libro advierte de arritmia y de daño pulmonar si se fuerza {p:111}.", "Combina hiperventilación y retención, la secuencia asociada a la pérdida de conocimiento {E:9,10}: retención siempre cómoda.", "Para ante hormigueo, mareo o visión borrosa. Contraindicaciones en <a href=\"#precauciones\">Precauciones</a>."],
    evidencia: "Técnica rápida y activadora, con más riesgo de efectos adversos que las lentas {E:2,5}.",
    profesor: ["El libro pide retener «hasta el límite» con los tres bandhas {p:109}. En este método la retención la pautas tú y su límite es cómodo para el cuerpo y la mente; Uddiyana es opcional.", "Prueba de control: el alumno debe poder espirar despacio y volver a inspirar con calma {p:114}.", "Variante alternada, más intensa: solo cuando la forma básica sea cómoda; máximo 50/min {p:110}."],
    metro: "bhastrika/b20" }
];
const APOYO = [
  { id: "neti", nombre: "Jala Neti", sub: "Lavado nasal", ref: "p. 42",
    texto: "<ol class=\"steps\"><li>Prepara el lota con agua salada templada: una cucharadita rasa de sal por medio litro {p:42}. <strong>Agua siempre hervida, destilada o estéril</strong>, nunca del grifo sin hervir: hay casos mortales de infección por la ameba <em>Naegleria fowleri</em> {E:17,18}.</li><li>Introduce la boquilla en una fosa e inclina la cabeza hacia el lado contrario; el agua sale por la otra fosa. Boca siempre abierta {p:42}.</li><li>Mitad del agua por cada lado {p:42}.</li><li>Sécate con espiraciones fuertes, con la cabeza hacia abajo, arriba, izquierda y derecha, durante 1–2 minutos {p:42}.</li></ol><p>Opcional; en casa, no en clase. No hacerlo con otitis, tapón nasal o sangrado {C}.</p>" },
  { id: "destapar", nombre: "Destapar una fosa", sub: "Antes de practicar", ref: "p. 47",
    texto: "<ul><li>Túmbate 1–3 minutos sobre el lado contrario a la fosa tapada {p:47}.</li><li>O presiona la axila contraria contra el respaldo de una silla durante unos segundos {p:47}.</li></ul>" },
  { id: "jalandhara", nombre: "Jalandhara Bandha", sub: "Cierre de la garganta", ref: "pp. 88–91",
    texto: "<ol class=\"steps\"><li>Tras inspirar, retén y traga saliva {p:88}.</li><li>Mantén la contracción de la garganta y lleva la barbilla a la horquilla del esternón, estirando la nuca {p:89}.</li><li>Comprobación: no puedes respirar {p:89}.</li><li>Al terminar, levanta la cabeza antes de espirar {C}.</li></ol><p>Obligatorio en retenciones de más de 10 segundos {p:59}. Evítalo con hipertiroidismo {p:91}, problemas cervicales o mareo al flexionar el cuello {C}. Alternativa: barbilla ligeramente recogida y retenciones de 10 s o menos.</p>" },
  { id: "asvini", nombre: "Asvini Mudra", sub: "Contrae / relaja", ref: "pp. 129–130",
    texto: "<ol class=\"steps\"><li>Contrae y eleva el ano durante 3 segundos {p:129}.</li><li>Relaja durante 3 segundos {p:129}.</li><li>Series de 5, que se van aumentando. Para aprender, tumbado con las rodillas dobladas {p:129–130}.</li></ol><p>Prepara Mula Bandha {p:133}. En el embarazo, solo con el visto bueno de la matrona o el médico {C}.</p>",
    metro: "asvini/base" },
  { id: "mula", nombre: "Mula Bandha", sub: "Cierre del suelo pélvico", ref: "pp. 133–134",
    texto: "<p>Contracción mantenida del suelo pélvico y de los esfínteres anales (externo e interno) durante la retención {p:133–134}. Se aprende después de Asvini Mudra. Debe hacerse sin tensar el rostro ni el abdomen alto.</p>" },
  { id: "uddiyana", nombre: "Uddiyana Bandha", sub: "Abdomen hacia dentro y arriba", ref: "p. 135",
    texto: "<p>Con los pulmones vacíos, haz una «falsa inspiración»: el diafragma sube y el abdomen se mete hacia la columna; mantén unos segundos {p:135}. En ayunas. En este método, solo como aprendizaje y opcional en Bhastrika. Contraindicado en embarazo, hernias, cirugía abdominal reciente e hipertensión {C}.</p>" },
  { id: "shavasana", nombre: "Shavasana", sub: "Relajación final", ref: "pp. 65, 159, 161",
    texto: "<p>Tumbado boca arriba, de 1 a 3 minutos al final de cada sesión, y siempre que aparezca fatiga {p:159, 161}. Con molestias lumbares, rodillas dobladas o piernas sobre una silla; en el embarazo avanzado, de lado izquierdo {C}.</p>" }
];

/* ---------- Datos: metrónomo ---------- */
const P = (key, label, extra) => Object.assign({ key, label }, extra);
const METRO = {
  conciencia: { nombre: "Toma de conciencia", type: "cycle", mode: "minutos", amount: 4, presets: [P("base", "4 : 6 sin retención", { p: [4, 0, 6, 0] }), P("suave", "3 : 5 sin retención", { p: [3, 0, 5, 0] })] },
  completa: { nombre: "Respiración completa", type: "cycle", mode: "minutos", amount: 5, presets: [P("base", "4 : 8", { p: [4, 0, 8, 0] }), P("suave", "3 : 6", { p: [3, 0, 6, 0] })] },
  nadi: { nombre: "Nadi Sodhana (alternada)", type: "cycle", alt: true, mode: "minutos", amount: 5, presets: [P("inicio", "4 : 1 : 4 por lado", { p: [4, 1, 4, 0] }), P("suave", "3 : 1 : 3 por lado", { p: [3, 1, 3, 0] }), P("largo", "5 : 1 : 5 por lado", { p: [5, 1, 5, 0] })] },
  ritmada: { nombre: "Respiración ritmada", type: "cycle", mode: "minutos", amount: 5, presets: [P("2-4", "2 : 4", { p: [2, 0, 4, 0] }), P("3-6", "3 : 6", { p: [3, 0, 6, 0] }), P("4-8", "4 : 8", { p: [4, 0, 8, 0] }), P("112", "1:1:2 → 4 : 4 : 8", { p: [4, 4, 8, 0] }), P("122", "1:2:2 → 4 : 8 : 8", { p: [4, 8, 8, 0] }), P("142", "1:4:2 → 4 : 16 : 8", { p: [4, 16, 8, 0] })] },
  ujjayi: { nombre: "Ujjayi simple", type: "cycle", mode: "ciclos", amount: 10, presets: [P("base", "4 : 2 : 8 : 2", { p: [4, 2, 8, 2] }), P("sin", "4 : 8 sin retenciones", { p: [4, 0, 8, 0] })] },
  pranamudra: { nombre: "Prana Mudra", type: "cycle", mode: "ciclos", amount: 5, labels: { in: "Inspira y sube las manos", hold: "Retén con los brazos abiertos", out: "Espira y baja las manos", holdEmpty: "Pausa con las manos en el regazo" }, presets: [P("base", "6 : 4 : 8 : 3", { p: [6, 4, 8, 3] }), P("suave", "6 : 2 : 8 : 2", { p: [6, 2, 8, 2] })] },
  recarga: { nombre: "Recarga pránica", type: "cycle", mode: "minutos", amount: 3, labels: { in: "Inspira: absorbe", hold: "Retén: reúne", out: "Espira: reparte" }, presets: [P("base", "4 : 4 : 8", { p: [4, 4, 8, 0] }), P("sin", "4 : 8 sin retención", { p: [4, 0, 8, 0] })] },
  viloma: { nombre: "Viloma (fraccionado)", type: "viloma", mode: "ciclos", amount: 5, presets: [P("A3", "Ciclo A · 3 etapas", { v: "A", stages: 3, stage: 2, final: 5, cont: 8 }), P("B3", "Ciclo B · 3 etapas", { v: "B", stages: 3, stage: 2, final: 5, cont: 6 }), P("A5", "Ciclo A · 5 etapas", { v: "A", stages: 5, stage: 2, final: 5, cont: 10 }), P("B5", "Ciclo B · 5 etapas", { v: "B", stages: 5, stage: 2, final: 5, cont: 8 })] },
  anuloma: { nombre: "Anuloma Viloma (alternada con retención)", type: "cycle", alt: true, mode: "minutos", amount: 5, presets: [P("112", "1:1:2 → 4 : 4 : 8", { p: [4, 4, 8, 0] }), P("122", "1:2:2 → 4 : 8 : 8", { p: [4, 8, 8, 0] }), P("132", "1:3:2 → 4 : 12 : 8", { p: [4, 12, 8, 0] }), P("142", "1:4:2 → 4 : 16 : 8", { p: [4, 16, 8, 0] }), P("5-20-10", "1:4:2 → 5 : 20 : 10 (pautado)", { p: [5, 20, 10, 0] })] },
  cuadrado: { nombre: "Pranayama cuadrado", type: "cycle", mode: "minutos", amount: 5, startEmpty: true, presets: [P("suave", "4 : 2 : 4 : 2 (suave)", { p: [4, 2, 4, 2] }), P("4", "4 : 4 : 4 : 4", { p: [4, 4, 4, 4] }), P("5", "5 : 5 : 5 : 5", { p: [5, 5, 5, 5] }), P("6", "6 : 6 : 6 : 6", { p: [6, 6, 6, 6] }), P("7", "7 : 7 : 7 : 7", { p: [7, 7, 7, 7] }), P("8", "8 : 8 : 8 : 8", { p: [8, 8, 8, 8] })] },
  kapalabhati: { nombre: "Kapalabhati", type: "rapid", presets: [5, 10, 20, 30, 40, 50, 60].map(c => P("k" + c, "3 ráfagas de " + c + " a 60/min", { count: c, tempo: 60, rounds: 3, rest: 30 })) },
  bhastrika: { nombre: "Bhastrika", type: "bhastrika", presets: [P("b20", "1 ronda de 20 a 30/min", { count: 20, tempo: 30, rounds: 1 }), P("b30", "2 rondas de 30 a 40/min", { count: 30, tempo: 40, rounds: 2 }), P("b40", "2 rondas de 40 a 40/min", { count: 40, tempo: 40, rounds: 2 }), P("b40x3", "3 rondas de 40 a 50/min", { count: 40, tempo: 50, rounds: 3 }), P("b60", "3 rondas de 60 a 60/min", { count: 60, tempo: 60, rounds: 3 })], extra: { inDeep: 4, hold: 5, outSlow: 10, rest: 60 } },
  asvini: { nombre: "Asvini Mudra", type: "cycle", mode: "ciclos", amount: 5, labels: { hold: "Contrae y eleva", holdEmpty: "Relaja" }, presets: [P("base", "3 s contrae · 3 s relaja", { p: [0, 3, 0, 3] })] }
};

/* ---------- Datos: calendario ---------- */
const FASES = [
  { n: 1, nombre: "Fundamentos", sem: "1–3", obj: "Atención al aliento, respiración completa con control abdominal y respiración alternada lenta." },
  { n: 2, nombre: "Equilibrio y ritmo", sem: "4–7", obj: "Igualar fosas y tiempos; ritmo 1:2 hasta 4:8; Ujjayi, Prana Mudra y recarga." },
  { n: 3, nombre: "Retenciones y bandhas", sem: "8–12", obj: "Viloma; de 1:1:2 a 1:2:2; Anuloma Viloma; Asvini, Jalandhara y Mula; cuadrado de 4 OM; primer Kapalabhati." },
  { n: 4, nombre: "Ritmo clásico y activación", sem: "13–18", obj: "Kapalabhati hasta el techo de 60; proporción 1:4:2; cuadrado de 6 OM; Kapalabhati II; Uddiyana." },
  { n: 5, nombre: "Integración y Bhastrika", sem: "19–24", obj: "Bhastrika progresiva con retención cómoda; cuadrado de 8 OM; rutina de la 4.ª etapa del libro." }
];
const L = (label, href) => [label, href];
const SEMANAS = [
  { n: 1, f: 1, tec: "Toma de conciencia; respiración completa (aprendizaje con los dedos); Shavasana", diario: "15 min", prop: "4 : 0 : 6 : 0", obj: "Observar sin forzar", crit: "5 min atento y sin fatiga", suave: "Tumbado", links: [L("Toma de conciencia", "#tecnica/conciencia"), L("Respiración completa", "#tecnica/completa"), L("Metrónomo 4:6", "#metronomo/conciencia/base")] },
  { n: 2, f: 1, tec: "Control abdominal; Nadi Sodhana lento", diario: "15 min", prop: "Nadi lento", obj: "Abdomen firme y mano correcta", crit: "Inspiras sin «balón»; alternas sin pensar en los dedos", suave: "Solo respiración completa", links: [L("Respiración completa", "#tecnica/completa"), L("Nadi Sodhana", "#tecnica/nadi"), L("Metrónomo 4:8", "#metronomo/completa/base")] },
  { n: 3, f: 1, tec: "Nadi Sodhana 5 min; respiración completa 4:8; destapar fosas", diario: "15–20 min", prop: "4 : 1 : 4 : 0", obj: "Igualar tiempos", crit: "5 min de Nadi igualado sin crispación", suave: "3 : 1 : 3 : 0", links: [L("Nadi Sodhana", "#tecnica/nadi"), L("Metrónomo Nadi 4:1:4", "#metronomo/nadi/inicio"), L("Destapar fosas", "#tecnica/destapar")] },
  { n: 4, f: 2, tec: "Ritmada 2:4 → 3:6; Nadi; Prana Mudra (gesto)", diario: "20 min", prop: "3 : 0 : 6 : 0", obj: "Sincronizar con el latido", crit: "3:6 cómodo durante 5 min", suave: "2 : 4", links: [L("Ritmada", "#tecnica/ritmada"), L("Metrónomo 2:4", "#metronomo/ritmada/2-4"), L("Metrónomo 3:6", "#metronomo/ritmada/3-6"), L("Prana Mudra", "#tecnica/pranamudra")] },
  { n: 5, f: 2, tec: "Ritmada 4:8; Ujjayi simple; Prana Mudra con atención", diario: "20 min", prop: "Ujjayi 4 : 2 : 8 : 2", obj: "Sonido continuo", crit: "3 ciclos de 10 Ujjayi sin tensión en el cuello", suave: "Ujjayi sin retenciones", links: [L("Ujjayi", "#tecnica/ujjayi"), L("Metrónomo Ujjayi", "#metronomo/ujjayi/base"), L("Metrónomo 4:8", "#metronomo/ritmada/4-8")] },
  { n: 6, f: 2, tec: "Nadi ritmado; Ujjayi 5 min; recarga (retención breve); Prana Mudra", diario: "2 × 12 min", prop: "4 : 2 : 8 : 0", obj: "Rutina de dos sesiones", crit: "7 días seguidos cómodos", suave: "1 sesión", links: [L("Recarga pránica", "#tecnica/recarga"), L("Metrónomo recarga", "#metronomo/recarga/base"), L("Metrónomo Prana Mudra", "#metronomo/pranamudra/base")] },
  { n: 7, f: 2, tec: "Consolidación de la fase 2; Ujjayi 8 min", diario: "2 × 15 min", prop: "4 : 2 : 8 : 2", obj: "Estabilidad", crit: "Ujjayi 8 min sin fatiga", suave: "Repetir la semana", links: [L("Metrónomo Ujjayi", "#metronomo/ujjayi/base")] },
  { n: 8, f: 3, tec: "Viloma A (3–4 etapas); Asvini 5 veces; Nadi; Ujjayi", diario: "2 × 15 min", prop: "A: (2+2)×3, 5, 8", obj: "Primeras retenciones fraccionadas", crit: "Ciclo A silencioso, sin bloqueos", suave: "Sin retención final", links: [L("Viloma", "#tecnica/viloma"), L("Metrónomo Viloma A", "#metronomo/viloma/A3"), L("Asvini", "#tecnica/asvini"), L("Metrónomo Asvini", "#metronomo/asvini/base")] },
  { n: 9, f: 3, tec: "Viloma A + B; ritmo 1:1:2; aprendizaje de Jalandhara", diario: "2 × 15 min", prop: "4 : 4 : 8 : 0", obj: "Retención corta y cómoda", crit: "Espiración lenta tras retener", suave: "4 : 2 : 8 : 0", links: [L("Metrónomo Viloma B", "#metronomo/viloma/B3"), L("Metrónomo 1:1:2", "#metronomo/ritmada/112"), L("Jalandhara", "#tecnica/jalandhara")] },
  { n: 10, f: 3, tec: "Anuloma Viloma 1:1:2; Viloma de 5–6 etapas; Asvini 10 veces", diario: "2 × 15–20 min", prop: "4 : 4 : 8 : 0", obj: "Retención en la respiración alternada", crit: "5 min sin acelerar la espiración", suave: "Nadi Sodhana", links: [L("Anuloma Viloma", "#tecnica/anuloma"), L("Metrónomo Anuloma 1:1:2", "#metronomo/anuloma/112"), L("Metrónomo Viloma A 5", "#metronomo/viloma/A5")] },
  { n: 11, f: 3, tec: "Anuloma 1:2:2 con Jalandhara; Viloma + Mula; Kapalabhati 3×10", diario: "2 × 20 min", prop: "4 : 8 : 8 : 0", obj: "Retención de 8 s; aprender Kapalabhati", crit: "8 s cómodos; tórax quieto en Kapalabhati", suave: "4 : 4 : 8; Kapalabhati 3×5", links: [L("Kapalabhati", "#tecnica/kapalabhati"), L("Metrónomo Kapalabhati 3×10", "#metronomo/kapalabhati/k10"), L("Metrónomo Anuloma 1:2:2", "#metronomo/anuloma/122"), L("Mula Bandha", "#tecnica/mula")] },
  { n: 12, f: 3, tec: "Cuadrado de 4 OM con Asvini; Anuloma 1:2:2; Kapalabhati 3×20", diario: "2 × 20 min", prop: "4 : 4 : 4 : 4", obj: "Cuadrado continuo", crit: "5 min de cuadrado sin fatiga", suave: "4 : 2 : 4 : 2", links: [L("Pranayama cuadrado", "#tecnica/cuadrado"), L("Metrónomo cuadrado 4", "#metronomo/cuadrado/4"), L("Metrónomo Kapalabhati 3×20", "#metronomo/kapalabhati/k20")] },
  { n: 13, f: 4, tec: "Kapalabhati 3×30; Anuloma 1:3:2; cuadrado de 5 OM", diario: "2 × 20 min", prop: "4 : 12 : 8 : 0", obj: "Hacia 1:4:2", crit: "12 s cómodos", suave: "4 : 8 : 8 : 0", links: [L("Metrónomo Kapalabhati 3×30", "#metronomo/kapalabhati/k30"), L("Metrónomo Anuloma 1:3:2", "#metronomo/anuloma/132"), L("Metrónomo cuadrado 5", "#metronomo/cuadrado/5")] },
  { n: 14, f: 4, tec: "Kapalabhati 3×40; Anuloma 1:4:2; Ujjayi 10 min", diario: "2 × 20–25 min", prop: "4 : 16 : 8 : 0", obj: "Ritmo clásico", crit: "Ciclo completo sin prisa al inspirar", suave: "4 : 12 : 8 : 0", links: [L("Metrónomo Kapalabhati 3×40", "#metronomo/kapalabhati/k40"), L("Metrónomo Anuloma 1:4:2", "#metronomo/anuloma/142")] },
  { n: 15, f: 4, tec: "Kapalabhati 3×50; cuadrado de 6 OM; Prana Mudra", diario: "2 × 25 min", prop: "6 : 6 : 6 : 6", obj: "Alargar el cuadrado", crit: "6 OM sostenidos sin fatiga", suave: "5 OM", links: [L("Metrónomo Kapalabhati 3×50", "#metronomo/kapalabhati/k50"), L("Metrónomo cuadrado 6", "#metronomo/cuadrado/6")] },
  { n: 16, f: 4, tec: "Kapalabhati 3×60 (techo del método); Anuloma 1:4:2; cuadrado de 6", diario: "2 × 25 min", prop: "4 : 16 : 8 : 0", obj: "Rutina de la 3.ª etapa", crit: "7 días sin mareo ni fatiga", suave: "3×50", links: [L("Metrónomo Kapalabhati 3×60", "#metronomo/kapalabhati/k60"), L("Metrónomo Anuloma 1:4:2", "#metronomo/anuloma/142")] },
  { n: 17, f: 4, tec: "Aprender Kapalabhati II (alternada, lenta); Uddiyana en ayunas", diario: "2 × 25 min", prop: "Igual", obj: "Coordinación de la mano", crit: "Alternancia sin perder la fuerza", suave: "Kapalabhati I", links: [L("Kapalabhati", "#tecnica/kapalabhati"), L("Uddiyana", "#tecnica/uddiyana")] },
  { n: 18, f: 4, tec: "Kapalabhati I 2 min + II; Anuloma 1:4:2; cuadrado de 6–7; Ujjayi", diario: "2 × 25 min", prop: "4 : 16 : 8 : 0", obj: "Consolidación de la fase 4", crit: "Sesión completa con soltura", suave: "Repetir la semana", links: [L("Metrónomo cuadrado 7", "#metronomo/cuadrado/7"), L("Metrónomo Ujjayi", "#metronomo/ujjayi/base")] },
  { n: 19, f: 5, tec: "Bhastrika: aprendizaje, 1 ronda de 20 a 30/min con retención cómoda pautada", diario: "2 × 25 min", prop: "20 respiraciones + retención cómoda", obj: "Amplitud sin velocidad", crit: "Espiración lenta tras la retención", suave: "Solo Kapalabhati", links: [L("Bhastrika", "#tecnica/bhastrika"), L("Metrónomo Bhastrika 1×20", "#metronomo/bhastrika/b20")] },
  { n: 20, f: 5, tec: "Bhastrika 2 rondas de 30 a 40/min; cuadrado de 7 OM", diario: "2 × 25–30 min", prop: "7 : 7 : 7 : 7", obj: "Ritmo amplio", crit: "Sin hormigueo ni mareo", suave: "1 ronda", links: [L("Metrónomo Bhastrika 2×30", "#metronomo/bhastrika/b30"), L("Metrónomo cuadrado 7", "#metronomo/cuadrado/7")] },
  { n: 21, f: 5, tec: "Bhastrika 2×40; Anuloma 5:20:10 opcional y pautado", diario: "2 × 30 min", prop: "5 : 20 : 10 : 0", obj: "Retención de unos 20 s, cómoda", crit: "Controlas la espiración y la inspiración siguiente", suave: "4 : 16 : 8 : 0", links: [L("Metrónomo Bhastrika 2×40", "#metronomo/bhastrika/b40"), L("Metrónomo Anuloma 5:20:10", "#metronomo/anuloma/5-20-10")] },
  { n: 22, f: 5, tec: "Rutina de la 4.ª etapa: Kapalabhati 2 min → descanso → Kapalabhati II → descanso → Bhastrika", diario: "2 × 30 min", prop: "Igual", obj: "Encadenar técnicas", crit: "Sesión sin fatiga posterior", suave: "Quitar Kapalabhati II", links: [L("Metrónomo Kapalabhati 3×60", "#metronomo/kapalabhati/k60"), L("Metrónomo Bhastrika 2×40", "#metronomo/bhastrika/b40")] },
  { n: 23, f: 5, tec: "Rutina de la 4.ª etapa + cuadrado de 8 OM + Prana Mudra", diario: "2 × 30 min", prop: "8 : 8 : 8 : 8", obj: "Absorción de la atención", crit: "8 OM estables", suave: "6 OM", links: [L("Metrónomo cuadrado 8", "#metronomo/cuadrado/8"), L("Metrónomo Prana Mudra", "#metronomo/pranamudra/base")] },
  { n: 24, f: 5, tec: "Bhastrika hasta 3 rondas de 40–60 si es cómodo; rutina personal", diario: "2 × 30 min", prop: "La propia", obj: "Autonomía", crit: "Rutina mantenida con soltura", suave: "La de la semana 18", links: [L("Metrónomo Bhastrika 3×40", "#metronomo/bhastrika/b40x3"), L("Metrónomo Bhastrika 3×60", "#metronomo/bhastrika/b60")] }
];

/* ---------- Datos: precauciones ---------- */
const CONTRA = [
  ["Enfermedad cardiaca (arritmias, cardiopatía isquémica, insuficiencia)", "Retenciones; Kapalabhati y Bhastrika", "La apnea desencadena el reflejo de inmersión: bradicardia brusca y vasoconstricción, con alteración del barorreflejo {E:11}. El libro cita la arritmia con Bhastrika {p:111} y excluye las retenciones en cardíacos {p:66, 115}.", "Evidencia + Libro"],
  ["Hipertensión no controlada", "Retenciones largas con esfuerzo; Kapalabhati y Bhastrika", "Retener con la glotis cerrada y empuje abdominal eleva la presión en el tórax (efecto tipo Valsalva). Las técnicas rápidas no bajan la tensión y aumentan la activación {E:5,6}. Las respiraciones lentas sí son adecuadas {E:3,4}.", "Evidencia + Prudencia"],
  ["Glaucoma, presión ocular alta, retina operada o desprendida", "Retenciones con esfuerzo; espiraciones forzadas; Kapalabhati y Bhastrika", "Espirar contra resistencia y el esfuerzo tipo Valsalva elevan de forma transitoria la presión del ojo {E:14}. El glaucoma es frecuente entre los casos de efectos adversos del yoga {E:7}.", "Evidencia"],
  ["Epilepsia", "Kapalabhati, Bhastrika y cualquier hiperventilación", "La hiperventilación se usa en el EEG para provocar actividad epiléptica, sobre todo en niños; en adultos su rendimiento es bajo {E:15}.", "Evidencia (moderada)"],
  ["Trastorno de pánico o ansiedad intensa", "Kapalabhati y Bhastrika; retenciones que generen angustia", "La hiperventilación provoca síntomas de pánico (certeza alta); la apnea no {E:16}. Prioriza espiraciones largas y suaves.", "Evidencia"],
  ["Enfermedad pulmonar (EPOC, enfisema, bullas, neumotórax previo)", "Kapalabhati y Bhastrika; retenciones largas", "Hay un caso documentado de neumotórax por Kapalabhati en una mujer sana {E:8}. El libro excluye Kapalabhati con afección pulmonar declarada {p:103} y cita el enfisema con Bhastrika {p:111}.", "Evidencia (caso) + Libro"],
  ["Asma", "Técnicas rápidas en fase no controlada; retenciones largas", "La hiperventilación y el aire frío o seco pueden desencadenar broncoespasmo. Practica solo con el asma controlada y la medicación a mano.", "Prudencia"],
  ["Embarazo", "Retenciones; Kapalabhati, Bhastrika, Uddiyana; bandhas intensos", "El yoga prenatal se considera seguro y beneficioso en conjunto {E:13}, pero no se encontró evidencia sobre retenciones ni respiración rápida. Por prudencia: compresión abdominal y presión intraabdominal. El libro recomienda Asvini en el embarazo {p:130–131}: solo con el visto bueno de la matrona o el médico.", "Prudencia + Libro"],
  ["Hernias, cirugía abdominal o torácica reciente, prolapso", "Kapalabhati, Bhastrika, Uddiyana; retención con empuje abdominal", "Aumentan bruscamente la presión intraabdominal.", "Prudencia"],
  ["Hipertiroidismo", "Jalandhara (según el libro, también el pranayama salvo la respiración completa)", "Compresión del cuello sobre la glándula tiroides {p:91}.", "Libro"],
  ["Problemas cervicales, mareo al flexionar el cuello, seno carotídeo sensible (sobre todo en mayores)", "Jalandhara completo", "La flexión intensa y la presión en el cuello actúan sobre los receptores de presión de la carótida: bradicardia e hipotensión refleja {p:89–90}. Alternativa: barbilla ligeramente recogida.", "Libro + Prudencia"],
  ["Infección o tapón nasal, otitis, sangrado nasal", "Jala Neti", "Riesgo de llevar líquido al oído o de empeorar la irritación.", "Prudencia"],
  ["Cualquier persona con agua no estéril", "Jala Neti con agua del grifo sin hervir", "Hay casos mortales de meningoencefalitis amebiana (Naegleria fowleri) por lavados nasales con agua contaminada. Usa agua hervida, destilada o estéril {E:17,18}.", "Evidencia"],
  ["Menores; personas mayores frágiles", "Retenciones largas; técnicas rápidas", "Menos margen de seguridad. En los casos de efectos adversos del yoga, más de la mitad de las personas tenía vulnerabilidades previas {E:1}.", "Evidencia (indirecta) + Prudencia"],
  ["Ayuno prolongado", "Retenciones tras respiración rápida", "El ayuno sumado a la hiperventilación aumenta la susceptibilidad a perder el conocimiento en apneas repetidas {E:10}.", "Evidencia"]
];
const ADAPT = [
  ["Caderas o rodillas rígidas", "Cojín o bloque firme bajo los isquiones, para que las rodillas queden por debajo de las caderas. Piernas cruzadas sencillas o una delante de la otra."],
  ["Dolor de rodillas o tobillos en Vajrasana", "Cojín entre los glúteos y los talones, manta bajo las espinillas o rollo bajo los tobillos. Si persiste, silla."],
  ["Silla", "Pies apoyados al ancho de las caderas; muslos horizontales o algo inclinados hacia abajo. Sentado en el borde, sin respaldo, o con un cojín lumbar si cuesta mantenerse recto."],
  ["Espalda baja cansada o dolorida", "Espalda contra la pared con un cojín fino en la zona lumbar. Sesiones más cortas."],
  ["No se puede estar sentado", "Tumbado boca arriba con las rodillas dobladas y los pies apoyados, o con las piernas sobre una silla. El libro lo admite para Viloma, la recarga y Ujjayi simple {p:65, 83, 115}. No para Kapalabhati ni Bhastrika, que requieren estar sentado con la columna recta {p:100, 109}."],
  ["Cuello: no se puede hacer Jalandhara", "Barbilla ligeramente recogida y nuca larga, sin apoyar en el pecho. Retenciones de 10 s o menos."],
  ["Hombro o brazo que se cansa en la alternada", "Codo apoyado en el pecho {p:49} o sobre un cojín en el regazo. Cambia de mano si hace falta."],
  ["Molestia en los dedos al tapar la nariz", "Usa pulgar e índice, o pulgar y anular. Presiona solo la parte blanda con la yema, nunca con la uña {p:48}."],
  ["Prana Mudra con hombros limitados", "Abre los brazos solo hasta donde no haya tensión; manos a la altura del pecho."],
  ["Embarazo", "Silla, o sentada con las piernas separadas y cojines bajo las rodillas. En el último trimestre, mejor de lado izquierdo que boca arriba durante mucho rato."],
  ["Mayores o equilibrio delicado", "Silla con respaldo siempre; pies firmes. Levantarse despacio al final."],
  ["Ojos", "Cerrados, o con la mirada baja y suave. Si cerrarlos genera ansiedad, entreabiertos."]
];
const GLOSARIO = [
  ["Ajna, Anahata, Manipura, Muladhara, Sahasrara, Svadhisthana, Vishuddha", "Chakras de la tradición: entrecejo, corazón, ombligo, base de la columna, coronilla, pubis y garganta. Se usan como puntos de atención, no como órganos {p:143–152}."],
  ["Apana / Prana Vayu", "En la tradición, «aire» de eliminación y de entrada {p:120–121}."],
  ["Asana", "Postura."],
  ["Asvini Mudra", "Contracción y relajación rítmica del ano {p:129}."],
  ["Bandha", "Cierre muscular."],
  ["Gnana Mudra", "Índice contra pulgar, el resto de los dedos extendidos {p:117}."],
  ["Ida / Pingala / Sushumna", "En la tradición, canales izquierdo, derecho y central {p:98}."],
  ["Jalandhara", "Barbilla al esternón con la garganta cerrada {p:88}."],
  ["Kumbhaka", "Retención del aliento."],
  ["Mula Bandha", "Cierre del suelo pélvico {p:133}."],
  ["Nadi", "En la tradición, canal de energía {p:46}."],
  ["Neti", "Lavado nasal {p:42}."],
  ["OM", "Sílaba usada como mantra y como unidad de ritmo {p:40, 84}."],
  ["Prana", "En la tradición, energía vital {p:6}."],
  ["Puraka / Rechaka", "Inspiración / espiración {p:52}."],
  ["Shavasana", "Relajación tumbado."],
  ["Uddiyana", "Abdomen hacia dentro y arriba con los pulmones vacíos {p:135}."],
  ["Ujjayi", "Respiración con la glotis parcialmente cerrada {p:112}."]
];
const FUENTES = [
  ["Sharma S, et al. Yoga and its risks: A systematic review of adverse events reported in case reports and case series. J Integr Med. 2026;24(5):667-682. PMID 42471295.", "10.1016/j.joim.2026.07.001", "84 eventos adversos; el pranayama forzado entre las prácticas más implicadas; el 54 % tenía vulnerabilidades previas; recomienda cribado previo."],
  ["Mütze C, et al. Effectiveness of pranayama for mental disorders: a systematic review and meta-analysis of RCTs. Front Psychiatry. 2025;16:1616996. PMID 40896223.", "10.3389/fpsyt.2025.1616996", "Efectos a corto plazo, alto riesgo de sesgo, no sustituye al tratamiento; más efectos adversos con respiración rápida que lenta."],
  ["Garg P, et al. Effect of breathing exercises on blood pressure and heart rate: A systematic review and meta-analysis. Int J Cardiol Cardiovasc Risk Prev. 2023;20:200232. PMID 38179185.", "10.1016/j.ijcrp.2023.200232", "Bajada modesta de la tensión sistólica (−7 mmHg), la diastólica (−3,4) y el pulso (−2,4/min); estudios con sesgo."],
  ["Sharma VK, et al. Effect of fast and slow pranayama on perceived stress and cardiovascular parameters in young health-care students. Int J Yoga. 2013;6(2):104-10. PMID 23930028.", "10.4103/0973-6131.113400", "Ambos reducen el estrés percibido; solo el lento mejora los parámetros cardiovasculares."],
  ["Nivethitha L, et al. Effects of various prāṇāyāma on cardiovascular and autonomic variables. Anc Sci Life. 2016;36(2):72-77. PMID 28446827.", "10.4103/asl.ASL_178_16", "Revisión narrativa: efectos beneficiosos con el pranayama lento, no con el rápido; resultados inconsistentes de la respiración por fosas."],
  ["Chetry D, et al. Heart Rate Variability and Mood State Changes in Three Yoga Breathing Practices: A Randomized Crossover Trial. Int J Yoga Therap. 2026;35. PMID 41580220.", "10.17761/2025-D-25-00006", "La respiración de alta frecuencia reduce la variabilidad cardiaca vagal; las lentas la aumentan."],
  ["Cramer H, et al. Adverse events associated with yoga: a systematic review of published case reports and case series. PLoS One. 2013;8(10):e75515. PMID 24146758.", "10.1371/journal.pone.0075515", "La respiración forzada entre las causas; los principiantes deben evitar prácticas extremas; el glaucoma entre las condiciones previas."],
  ["Johnson DB, et al. Kapalabhati pranayama: breath of fire or cause of pneumothorax? A case report. Chest. 2004;125(5):1951-2. PMID 15136413.", "10.1378/chest.125.5.1951", "Neumotórax en una mujer sana de 29 años."],
  ["Pernett F, et al. Toward a hyperventilation detection system in freediving. Front Physiol. 2025;15:1498399. PMID 39835203.", "10.3389/fphys.2024.1498399", "La hiperventilación antes de la apnea es un factor de riesgo de síncope hipóxico."],
  ["Elia A, et al. Effects of hyperventilation on repeated breath-holding while in a fasting state. Am J Physiol Regul Integr Comp Physiol. 2024;326(4):R319-R329. PMID 38314699.", "10.1152/ajpregu.00260.2023", "La hiperventilación alarga la apnea pero retrasa la señal de respirar y aumenta el riesgo de perder el conocimiento, más en ayunas y con repeticiones."],
  ["Panneton WM, Gan Q. The Mammalian Diving Response: Inroads to Its Neural Control. Front Neurosci. 2020;14:524. PMID 32581683.", "10.3389/fnins.2020.00524", "La apnea produce bradicardia y vasoconstricción y altera el barorreflejo."],
  ["Fitz-Clarke JR. Breath-Hold Diving. Compr Physiol. 2018;8(2):585-630. PMID 29687909.", "10.1002/cphy.c160008", "Respuestas de inmersión en humanos, menores que en mamíferos marinos; pérdida de conocimiento por hipoxia en apneas largas."],
  ["Babbar S, Shyken J. Yoga in Pregnancy. Clin Obstet Gynecol. 2016;59(3):600-12. PMID 27152528.", "10.1097/GRF.0000000000000210", "El yoga prenatal, beneficioso y seguro en conjunto; no evalúa retenciones ni respiración rápida."],
  ["Baytaroğlu A, et al. Respiratory Muscle Training and Intraocular Pressure. J Glaucoma. 2026;35(8):572-580. PMID 42440085.", "10.1097/IJG.0000000000002734", "La espiración contra resistencia sube la presión intraocular de forma transitoria (~3 mmHg), según la dosis."],
  ["Denhard KA, et al. Yield of Hyperventilation and Other Activation Procedures and Study Parameters in Facilitating Epileptiform Discharges. J Clin Neurophysiol. 2026. PMID 41705827.", "10.1097/WNP.0000000000001244", "La hiperventilación es un procedimiento de activación del EEG; en los adultos de esa serie no activó descargas."],
  ["Tural U, et al. Comparative diagnostic accuracy of panic provocation tests: A meta-analysis. J Psychiatr Res. 2026;200:174-183. PMID 42190597.", "10.1016/j.jpsychires.2026.05.033", "La hiperventilación provoca pánico con certeza alta; la apnea no discrimina."],
  ["Alanazi A, et al. Advancing the understanding of Naegleria fowleri. J Infect Public Health. 2025;18(4):102690. PMID 39913985.", "10.1016/j.jiph.2025.102690", "Infección casi siempre mortal; prevención: agua hervida o destilada para los lavados nasales."],
  ["Stubhaug TT, et al. Fatal primary amoebic meningoencephalitis in a Norwegian tourist returning from Thailand. JMM Case Rep. 2016;3(3):e005042. PMID 28348761.", "10.1099/jmmcr.0.005042", "Caso mortal atribuido a irrigación nasal con agua del grifo contaminada."]
];



const CONCEPTOS = [
  ["Prana", "En la tradición yóguica, la energía vital. Es una imagen para orientar la atención, no una magnitud física {p:6–8}."],
  ["Pranayama", "Prana + ayama: alargar, retener, controlar. Es respirar con atención y control, no solo hacer ejercicios respiratorios {p:7, 30}."],
  ["La atención es la clave", "Sin concentración, el pranayama se queda en un ejercicio. Cuando la mente se vaya, vuelve al aliento sin juzgarte {p:140, 158}."],
  ["Por la nariz", "Respira siempre por la nariz, con las aletas ligeramente abiertas y sin ruido {p:34–35, 159}."],
  ["Las cuatro fases", "Puraka: inspiración. Kumbhaka: retención con pulmones llenos. Rechaka: espiración. Kumbhaka vacío: retención con pulmones vacíos {p:52, 84}."],
  ["Ritmo antes que duración", "Lo esencial es la soltura y el ritmo. La duración es lo único que puede dar problemas si se fuerza {p:59, 63}."],
  ["Proporción", "Se cuenta en unidades: latidos u OM mentales. La espiración suele durar el doble que la inspiración (1 : 2) {p:62–63}. En la app, 1 unidad ≈ 1 segundo, ajustable a tu pulso {C}."],
  ["Respiración completa", "Abdomen → costillas → clavículas. Bajo el ombligo, firme sin endurecerse; al espirar, vacía hasta el final {p:73–79}. Es la base de casi todo."],
  ["Nadis y bandhas", "Nadis: canales de la tradición (Ida a la izquierda, Pingala a la derecha, Sushumna al centro) {p:98}. Bandhas: cierres musculares reales que acompañan las retenciones {p:88}."],
  ["Posturas antes que pranayama", "El autor recomienda dejar las retenciones largas para después de la sesión de posturas {p:57, 87}."],
  ["Señal de que te has pasado", "No poder espirar despacio tras una retención, o tener que tomar aire deprisa. Vuelve a una retención más corta {p:58, 114}."],
  ["Despacio y cada día", "No quemes etapas. Tras una interrupción, recorre de nuevo las etapas, más rápido {p:64, 161}."]
];
const EVIDENCIA = [
  "Las respiraciones lentas se asocian a pequeñas bajadas de la tensión y del pulso; efectos modestos, de estudios con riesgo de sesgo {E:3,4}.",
  "El pranayama muestra efectos a corto plazo sobre síntomas psicológicos, pero no sustituye ningún tratamiento {E:2}.",
  "Las técnicas rápidas (Kapalabhati, Bhastrika) activan en lugar de calmar y concentran más efectos adversos {E:2,6}.",
  "Retener el aliento desencadena el reflejo de inmersión: el corazón se enlentece {E:11,12}."
];
const REGLAS = [
  ["Estómago vacío", "30 min tras comer; 3 h para retenciones largas {p:49, 57, 161}."],
  ["Nariz despejada", "Vejiga vacía, lugar ventilado y templado {p:159}."],
  ["Columna recta", "Rostro relajado; usa adaptaciones si las necesitas {p:78}."],
  ["Siempre por la nariz", "Salvo indicación expresa {p:159}."]
];
const PARAR = "Mareo, hormigueo en manos o labios, visión borrosa, falta de aire, palpitaciones, presión en la cabeza o los ojos, dolor torácico o ansiedad creciente.";
const CONDICIONES = [
  ["Estómago vacío", "30 min sin retención; 1,5–5 h con retenciones; 3 h con retenciones prolongadas {p:49, 57, 161}."],
  ["Nariz limpia", "Si una fosa está tapada, destápala antes {p:47, 159}."],
  ["Lugar ventilado y templado", "{p:159}"],
  ["Columna recta", "Con la espalda curvada no hay control abdominal {p:78}."],
  ["Lengua y ojos", "Lengua quieta detrás de los incisivos o contra el paladar; ojos cerrados {p:38, 159}."],
  ["Termina siempre", "Con 1–3 min de relajación tumbado {p:159}."]
];
const FUERA = [
  ["Surya Bheda Kumbhaka", "Retención prolongada con los tres bandhas {p:122–123}."],
  ["Purna Ujjayi", "Ujjayi con retención prolongada {p:113–115}."],
  ["Bandha Traya completa", "{p:135}"],
  ["Activación de chakras / Pranuttana", "Etapa 6 del libro, solo con guía cualificado {p:153–160}. Sin base científica."],
  ["Sitali, Sitkari, Plavini, Bhramari", "El autor las considera menores o las desaconseja en climas fríos {p:118}."]
];

window.PR_DATA = { TECNICAS, APOYO, METRO, FASES, SEMANAS, CONTRA, ADAPT, GLOSARIO, FUENTES, CONCEPTOS, EVIDENCIA, REGLAS, PARAR, CONDICIONES, FUERA };
})();
