const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const wilayas = [
    { id: 1, code: '01', nameFr: 'Adrar', nameAr: 'أدرار' },
    { id: 2, code: '02', nameFr: 'Chlef', nameAr: 'الشلف' },
    { id: 3, code: '03', nameFr: 'Laghouat', nameAr: 'الأغواط' },
    { id: 4, code: '04', nameFr: 'Oum El Bouaghi', nameAr: 'أم البواقي' },
    { id: 5, code: '05', nameFr: 'Batna', nameAr: 'باتنة' },
    { id: 6, code: '06', nameFr: 'Béjaïa', nameAr: 'بجاية' },
    { id: 7, code: '07', nameFr: 'Biskra', nameAr: 'بسكرة' },
    { id: 8, code: '08', nameFr: 'Béchar', nameAr: 'بشار' },
    { id: 9, code: '09', nameFr: 'Blida', nameAr: 'البليدة' },
    { id: 10, code: '10', nameFr: 'Bouira', nameAr: 'البويرة' },
    { id: 11, code: '11', nameFr: 'Tamanrasset', nameAr: 'تمنراست' },
    { id: 12, code: '12', nameFr: 'Tébessa', nameAr: 'تبسة' },
    { id: 13, code: '13', nameFr: 'Tlemcen', nameAr: 'تلمسان' },
    { id: 14, code: '14', nameFr: 'Tiaret', nameAr: 'تيارت' },
    { id: 15, code: '15', nameFr: 'Tizi Ouzou', nameAr: 'تيزي وزو' },
    { id: 16, code: '16', nameFr: 'Alger', nameAr: 'الجزائر' },
    { id: 17, code: '17', nameFr: 'Djelfa', nameAr: 'الجلفة' },
    { id: 18, code: '18', nameFr: 'Jijel', nameAr: 'جيجل' },
    { id: 19, code: '19', nameFr: 'Sétif', nameAr: 'سطيف' },
    { id: 20, code: '20', nameFr: 'Saïda', nameAr: 'سعيدة' },
    { id: 21, code: '21', nameFr: 'Skikda', nameAr: 'سكيكدة' },
    { id: 22, code: '22', nameFr: 'Sidi Bel Abbès', nameAr: 'سيدي بلعباس' },
    { id: 23, code: '23', nameFr: 'Annaba', nameAr: 'عنابة' },
    { id: 24, code: '24', nameFr: 'Guelma', nameAr: 'قالمة' },
    { id: 25, code: '25', nameFr: 'Constantine', nameAr: 'قسنطينة' },
    { id: 26, code: '26', nameFr: 'Médéa', nameAr: 'المدية' },
    { id: 27, code: '27', nameFr: 'Mostaganem', nameAr: 'مستغانم' },
    { id: 28, code: '28', nameFr: 'M\'Sila', nameAr: 'المسيلة' },
    { id: 29, code: '29', nameFr: 'Mascara', nameAr: 'معسكر' },
    { id: 30, code: '30', nameFr: 'Ouargla', nameAr: 'ورقلة' },
    { id: 31, code: '31', nameFr: 'Oran', nameAr: 'وهران' },
    { id: 32, code: '32', nameFr: 'El Bayadh', nameAr: 'البيض' },
    { id: 33, code: '33', nameFr: 'Illizi', nameAr: 'إليزي' },
    { id: 34, code: '34', nameFr: 'Bordj Bou Arreridj', nameAr: 'برج بوعريريج' },
    { id: 35, code: '35', nameFr: 'Boumerdès', nameAr: 'بومرداس' },
    { id: 36, code: '36', nameFr: 'El Tarf', nameAr: 'الطارف' },
    { id: 37, code: '37', nameFr: 'Tindouf', nameAr: 'تندوف' },
    { id: 38, code: '38', nameFr: 'Tissemsilt', nameAr: 'تيسمسيلت' },
    { id: 39, code: '39', nameFr: 'El Oued', nameAr: 'الوادي' },
    { id: 40, code: '40', nameFr: 'Khenchela', nameAr: 'خنشلة' },
    { id: 41, code: '41', nameFr: 'Souk Ahras', nameAr: 'سوق أهراس' },
    { id: 42, code: '42', nameFr: 'Tipaza', nameAr: 'تيبازة' },
    { id: 43, code: '43', nameFr: 'Mila', nameAr: 'ميلة' },
    { id: 44, code: '44', nameFr: 'Aïn Defla', nameAr: 'عين الدفلى' },
    { id: 45, code: '45', nameFr: 'Naâma', nameAr: 'النعامة' },
    { id: 46, code: '46', nameFr: 'Aïn Témouchent', nameAr: 'عين تموشنت' },
    { id: 47, code: '47', nameFr: 'Ghardaïa', nameAr: 'غرداية' },
    { id: 48, code: '48', nameFr: 'Relizane', nameAr: 'غليزان' },
    { id: 49, code: '49', nameFr: 'Timimoun', nameAr: 'تيميمون' },
    { id: 50, code: '50', nameFr: 'Bordj Badji Mokhtar', nameAr: 'برج باجي مختار' },
    { id: 51, code: '51', nameFr: 'Ouled Djellal', nameAr: 'أولاد جلال' },
    { id: 52, code: '52', nameFr: 'Béni Abbès', nameAr: 'بني عباس' },
    { id: 53, code: '53', nameFr: 'In Salah', nameAr: 'عين صالح' },
    { id: 54, code: '54', nameFr: 'In Guezzam', nameAr: 'عين قزام' },
    { id: 55, code: '55', nameFr: 'Touggourt', nameAr: 'تقرت' },
    { id: 56, code: '56', nameFr: 'Djanet', nameAr: 'جانت' },
    { id: 57, code: '57', nameFr: 'El M\'Ghair', nameAr: 'المغير' },
    { id: 58, code: '58', nameFr: 'El Meniaa', nameAr: 'المنيعة' }
];

async function main() {
    console.log('Start seeding ...');

    for (const w of wilayas) {
        const wilaya = await prisma.wilaya.upsert({
            where: { id: w.id },
            update: {},
            create: w,
        });
        console.log(`Created wilaya with id: ${wilaya.id}`);
    }

    console.log('Seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
