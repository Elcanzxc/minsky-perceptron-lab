import type { GateType, Language, MissionId } from '../types/perceptron';

export interface Mission {
  id: MissionId;
  gate: GateType;
  title: Record<Language, string>;
  hint: Record<Language, string>;
}

export const MISSIONS: Mission[] = [
  {
    id: 'm1',
    gate: 'AND',
    title: { EN: 'Hand calibration', AZ: 'Əl ilə kalibrləmə', RU: 'Ручная калибровка' },
    hint: {
      EN: 'The potentiometers are zeroed. Turn w₁, w₂ and b by hand until AND passes all 4 rows.',
      AZ: 'Potensiometrlər sıfırlanıb. AND bütün 4 sətirdən keçənə qədər w₁, w₂ və b-ni əl ilə fırladın.',
      RU: 'Потенциометры обнулены. Крутите w₁, w₂ и b вручную, пока AND не пройдёт все 4 строки.',
    },
  },
  {
    id: 'm2',
    gate: 'OR',
    title: { EN: 'Let the machine learn', AZ: 'Qoy maşın öyrənsin', RU: 'Пусть машина учится' },
    hint: {
      EN: 'Run the learning rule on OR starting from zero weights and watch the line find its place.',
      AZ: 'Sıfır çəkilərdən başlayaraq OR üçün öyrənmə qaydasını işə salın və xəttin yerini tapmasını izləyin.',
      RU: 'Запустите правило обучения для OR с нулевых весов и посмотрите, как прямая находит своё место.',
    },
  },
  {
    id: 'm3',
    gate: 'AND',
    title: { EN: 'Inspect the arithmetic', AZ: 'Hesablamanı incələ', RU: 'Разбери арифметику' },
    hint: {
      EN: 'Click a truth-table row or a beacon on the CRT and read the step-by-step formula.',
      AZ: 'Həqiqət cədvəlinin sətrinə və ya ekrandakı nöqtəyə klikləyin və addım-addım düsturu oxuyun.',
      RU: 'Кликните по строке таблицы истинности или точке на экране и прочитайте пошаговую формулу.',
    },
  },
  {
    id: 'm4',
    gate: 'XOR',
    title: { EN: 'Face the crisis', AZ: 'Böhranla üzləş', RU: 'Встреться с кризисом' },
    hint: {
      EN: 'Train XOR for at least 10 epochs and watch the errors never reach zero.',
      AZ: 'XOR-u ən azı 10 epoxa öyrədin və xətaların heç vaxt sıfıra enmədiyini görün.',
      RU: 'Обучайте XOR хотя бы 10 эпох и убедитесь, что ошибки никогда не исчезают.',
    },
  },
  {
    id: 'm5',
    gate: 'XOR',
    title: { EN: 'Read the proof', AZ: 'Sübutu oxu', RU: 'Прочитай доказательство' },
    hint: {
      EN: 'Open the Minsky–Papert proof and see why no line can ever work.',
      AZ: 'Minski–Papert sübutunu açın və heç bir xəttin niyə işləyə bilmədiyini görün.',
      RU: 'Откройте доказательство Минского–Пейперта и поймите, почему ни одна прямая не сработает.',
    },
  },
  {
    id: 'm6',
    gate: 'XOR',
    title: { EN: 'Add a hidden layer', AZ: 'Gizli təbəqə əlavə et', RU: 'Добавь скрытый слой' },
    hint: {
      EN: 'Engage the MLP patch-bay and solve XOR with two lines at once.',
      AZ: 'MLP patch-panelini qoşun və XOR-u eyni anda iki xətlə həll edin.',
      RU: 'Подключите MLP-коммутатор и решите XOR сразу двумя прямыми.',
    },
  },
  {
    id: 'm7',
    gate: 'XOR',
    title: { EN: 'Rewire it yourself', AZ: 'Özün yenidən qoş', RU: 'Перекоммутируй сам' },
    hint: {
      EN: 'The cords are scrambled. Re-plug the neurons until the network works — can you find a non-textbook solution?',
      AZ: 'Kabellər qarışdırılıb. Şəbəkə işləyənə qədər neyronları dəyişin — dərslikdə olmayan həll tapa bilərsinizmi?',
      RU: 'Шнуры перепутаны. Переключайте нейроны, пока сеть не заработает, — найдёте решение не из учебника?',
    },
  },
];

