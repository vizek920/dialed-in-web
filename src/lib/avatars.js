// قائمة الشخصيات بالترتيب الذي تظهر به (المعرّف يطابق الخادم)
export const AVATARS = [
  { id: 'penguin', name: 'البطريق' },
  { id: 'bear', name: 'الدب القطبي' },
  { id: 'fox', name: 'الثعلب' },
  { id: 'snowman', name: 'رجل الثلج' },
  { id: 'owl', name: 'البومة' },
  { id: 'reindeer', name: 'الرنة' },
  { id: 'seal', name: 'الفقمة' },
  { id: 'hare', name: 'الأرنب' },
  { id: 'husky', name: 'الهاسكي' },
  { id: 'yeti', name: 'اليتي' },
  { id: 'snowcat', name: 'قطة الثلج' },
  { id: 'walrus', name: 'الفظ' },
];

export const avatarName = (id) => AVATARS.find((a) => a.id === id)?.name ?? '';
