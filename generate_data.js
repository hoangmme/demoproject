const fs = require('fs');

function generateData() {
  const data = {
    departments: [
      { id: 'd1', name: 'Công an TP.HCM' },
      { id: 'd2', name: 'Sở Tư pháp TP.HCM' },
      { id: 'd3', name: 'Cục Thuế TP.HCM' },
      { id: 'd4', name: 'Sở Ngoại vụ TP.HCM' },
      { id: 'd5', name: 'UBND Quận 1' }
    ],
    positions: [
      { id: 'p1', name: 'Trưởng phòng' },
      { id: 'p2', name: 'Phó Giám đốc' },
      { id: 'p3', name: 'Chuyên viên' },
      { id: 'p4', name: 'Giám đốc' },
      { id: 'p5', name: 'Nhân viên' }
    ],
    countries: [
      { id: 'c1', name: 'Hoa Kỳ' },
      { id: 'c2', name: 'Nhật Bản' },
      { id: 'c3', name: 'Hàn Quốc' },
      { id: 'c4', name: 'Úc' },
      { id: 'c5', name: 'Singapore' },
      { id: 'c6', name: 'Pháp' }
    ],
    purposes: [
      { id: 'pur1', name: 'Công tác' },
      { id: 'pur2', name: 'Học tập, tập huấn' },
      { id: 'pur3', name: 'Du lịch' },
      { id: 'pur4', name: 'Thăm thân' },
      { id: 'pur5', name: 'Chữa bệnh' }
    ],
    fundings: [
      { id: 'f1', name: 'Ngân sách nhà nước' },
      { id: 'f2', name: 'Tự túc' },
      { id: 'f3', name: 'Học bổng' },
      { id: 'f4', name: 'Tài trợ' }
    ],
    relationships: [
      { id: 'r1', name: 'Vợ/Chồng' },
      { id: 'r2', name: 'Con ruột' },
      { id: 'r3', name: 'Cha mẹ' },
      { id: 'r4', name: 'Anh/chị/em ruột' }
    ],
    personnels: [],
    appendix1: [],
    appendix2: [],
    appendix3: []
  };

  // 1. Sinh dữ liệu cố định (Ngôi sao)
  const star1 = {
    id: "cb-star-1",
    code: "CB00001",
    name: "Nguyễn Văn A",
    cccd: "079201001234",
    birthYear: 1980,
    departmentId: "d1",
    positionId: "p1"
  };
  const star2 = {
    id: "cb-star-2",
    code: "CB00002",
    name: "Trần Thị B",
    cccd: "079201005678",
    birthYear: 1985,
    departmentId: "d2",
    positionId: "p2"
  };
  
  data.personnels.push(star1, star2);

  // Appx 1 cho star1 (5 lần)
  for(let i=1; i<=5; i++) {
    data.appendix1.push({
      id: `a1-star1-${i}`,
      personnelId: star1.id,
      decisionNumber: `${100+i}/QĐ-CA`,
      decisionDate: `202${i}-01-10`,
      decisionIssuer: "UBND TP.HCM",
      departureDate: `202${i}-02-01`,
      arrivalDate: `202${i}-02-15`,
      countryId: `c${i}`,
      tripCount: i,
      purposeId: i%2===0 ? 'pur1' : 'pur3',
      fundingId: i%2===0 ? 'f1' : 'f2'
    });
  }

  // Appx 2 cho star1 (3 thân nhân)
  data.appendix2.push({
    id: `a2-star1-1`,
    personnelId: star1.id,
    relationshipId: 'r2',
    relativeName: "Nguyễn Văn C",
    birthYear: 2005,
    currentAddress: "California, USA",
    occupation: "Sinh viên",
    studyWorkAddress: "UCLA",
    countryId: 'c1',
    timeAbroad: "Từ 2023 đến nay",
    unitAbroad: "UCLA",
    fundingId: 'f2', // tự túc
    currentUnit: "",
    marriedToForeigner: false,
    workInForeignCompany: false
  });
  data.appendix2.push({
    id: `a2-star1-2`,
    personnelId: star1.id,
    relationshipId: 'r4',
    relativeName: "Nguyễn Thị D",
    birthYear: 1982,
    currentAddress: "Tokyo, Japan",
    occupation: "Kỹ sư",
    studyWorkAddress: "Công ty ABC",
    countryId: 'c2',
    timeAbroad: "Từ 2015 đến nay",
    unitAbroad: "Công ty ABC",
    fundingId: 'f2',
    currentUnit: "Công ty ABC",
    marriedToForeigner: true,
    workInForeignCompany: true
  });

  // Appx 3 cho star 1 (vài lịch sử)
  data.appendix3.push({
    id: `a3-star1-1`,
    personnelId: star1.id,
    trainingType: "Thạc sĩ",
    trainingPlace: "Mỹ",
    trainingRole: "Học viên",
    sponsorUnit: "Đại học XYZ",
    fundingId: "f3",
    trainingTime: "2010-09-01 đến 2012-09-01",
    countryId: "c1",
    marriedToForeigner: false,
    receivedGiftOver50M: false,
    rentHouseToForeigner: false,
    workInForeignCompany: false
  });


  // 2. Sinh dữ liệu ngẫu nhiên (50 CB)
  const firstNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ"];
  const middleNames = ["Thị", "Văn", "Hữu", "Minh", "Đức", "Ngọc", "Thu", "Hải", "Xuân", "Thanh"];
  const lastNames = ["Anh", "Bình", "Cường", "Dũng", "Em", "Hương", "Linh", "Nhung", "Oanh", "Phong", "Quang", "Sơn", "Tâm", "Trang", "Tuấn", "Vy"];

  const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  for (let i = 3; i <= 50; i++) {
    const cbId = `cb-random-${i}`;
    const code = `CB${i.toString().padStart(5, '0')}`;
    const name = `${randomItem(firstNames)} ${randomItem(middleNames)} ${randomItem(lastNames)}`;
    const cccd = `079${randomNumber(100000000, 999999999)}`;
    const birthYear = randomNumber(1970, 2000);
    
    data.personnels.push({
      id: cbId,
      code: code,
      name: name,
      cccd: cccd,
      birthYear: birthYear,
      departmentId: randomItem(data.departments).id,
      positionId: randomItem(data.positions).id
    });

    // Random Appx 1 (0-3 lần)
    const numAppx1 = randomNumber(0, 3);
    for (let j = 1; j <= numAppx1; j++) {
      data.appendix1.push({
        id: `a1-${cbId}-${j}`,
        personnelId: cbId,
        decisionNumber: `${randomNumber(100, 999)}/QĐ`,
        decisionDate: `202${randomNumber(0,4)}-0${randomNumber(1,9)}-1${randomNumber(0,9)}`,
        decisionIssuer: "Cơ quan",
        departureDate: `202${randomNumber(0,4)}-10-01`,
        arrivalDate: `202${randomNumber(0,4)}-10-15`,
        countryId: randomItem(data.countries).id,
        tripCount: j,
        purposeId: randomItem(data.purposes).id,
        fundingId: randomItem(data.fundings).id
      });
    }

    // Random Appx 2 (0-2 thân nhân)
    const numAppx2 = randomNumber(0, 2);
    for (let j = 1; j <= numAppx2; j++) {
      data.appendix2.push({
        id: `a2-${cbId}-${j}`,
        personnelId: cbId,
        relationshipId: randomItem(data.relationships).id,
        relativeName: `${randomItem(firstNames)} ${randomItem(middleNames)} ${randomItem(lastNames)}`,
        birthYear: randomNumber(1950, 2020),
        currentAddress: "Nước ngoài",
        occupation: "Nghề nghiệp tự do",
        studyWorkAddress: "Địa chỉ...",
        countryId: randomItem(data.countries).id,
        timeAbroad: "Vài năm",
        unitAbroad: "Không rõ",
        fundingId: randomItem(data.fundings).id,
        currentUnit: "Không",
        marriedToForeigner: Math.random() > 0.8,
        workInForeignCompany: Math.random() > 0.8
      });
    }
  }

  fs.writeFileSync('data/db.json', JSON.stringify(data, null, 2));
  console.log("Đã tạo xong file data/db.json với dữ liệu mẫu!");
}

if (!fs.existsSync('data')) {
  fs.mkdirSync('data');
}
generateData();
