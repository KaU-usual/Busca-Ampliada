// Gerado a partir das ligações ocidentais do Stellarium e das coordenadas HYG.
export type Star = {
  hip: number
  name: string
  ra: number
  dec: number
  mag: number
}

export type ConstellationLine = {
  from: number
  to: number
  thin: boolean
}

export type ConstellationDefinition = {
  code: string
  name: string
  note: string
  position: [number, number]
  stars: Star[]
  lines: ConstellationLine[]
}

export const constellationCatalog: ConstellationDefinition[] = [
  {
    "code": "UMa",
    "name": "Ursa Maior",
    "note": "O Grande Carro é parte da Ursa Maior, uma das figuras mais reconhecidas do céu.",
    "position": [
      65,
      65
    ],
    "stars": [
      {
        "hip": 67301,
        "name": "Alkaid",
        "ra": 13.792354,
        "dec": 49.313265,
        "mag": 1.85
      },
      {
        "hip": 65378,
        "name": "Mizar",
        "ra": 13.398747,
        "dec": 54.925362,
        "mag": 2.23
      },
      {
        "hip": 62956,
        "name": "Alioth",
        "ra": 12.900472,
        "dec": 55.959821,
        "mag": 1.76
      },
      {
        "hip": 59774,
        "name": "Megrez",
        "ra": 12.257086,
        "dec": 57.032617,
        "mag": 3.32
      },
      {
        "hip": 54061,
        "name": "Dubhe",
        "ra": 11.062155,
        "dec": 61.751033,
        "mag": 1.81
      },
      {
        "hip": 53910,
        "name": "Merak",
        "ra": 11.030677,
        "dec": 56.382427,
        "mag": 2.34
      },
      {
        "hip": 58001,
        "name": "Phecda",
        "ra": 11.897168,
        "dec": 53.69476,
        "mag": 2.41
      },
      {
        "hip": 57399,
        "name": "Taiyangshou",
        "ra": 11.767515,
        "dec": 47.779406,
        "mag": 3.69
      },
      {
        "hip": 54539,
        "name": "52Psi UMa",
        "ra": 11.161062,
        "dec": 44.498487,
        "mag": 3.0
      },
      {
        "hip": 50372,
        "name": "Tania Borealis",
        "ra": 10.284952,
        "dec": 42.914365,
        "mag": 3.45
      },
      {
        "hip": 50801,
        "name": "Tania Australis",
        "ra": 10.372155,
        "dec": 41.499516,
        "mag": 3.06
      },
      {
        "hip": 48402,
        "name": "30Phi UMa",
        "ra": 9.868433,
        "dec": 54.064332,
        "mag": 4.55
      },
      {
        "hip": 46853,
        "name": "25The UMa",
        "ra": 9.547715,
        "dec": 51.6773,
        "mag": 3.17
      },
      {
        "hip": 44471,
        "name": "Alkaphrah",
        "ra": 9.060427,
        "dec": 47.156525,
        "mag": 3.57
      },
      {
        "hip": 44127,
        "name": "Talitha",
        "ra": 8.986828,
        "dec": 48.041826,
        "mag": 3.12
      },
      {
        "hip": 48319,
        "name": "29Ups UMa",
        "ra": 9.849867,
        "dec": 59.038735,
        "mag": 3.78
      },
      {
        "hip": 41704,
        "name": "Muscida",
        "ra": 8.504431,
        "dec": 60.718169,
        "mag": 3.35
      },
      {
        "hip": 46733,
        "name": "23    UMa",
        "ra": 9.525453,
        "dec": 63.061861,
        "mag": 3.65
      }
    ],
    "lines": [
      {
        "from": 0,
        "to": 1,
        "thin": false
      },
      {
        "from": 1,
        "to": 2,
        "thin": false
      },
      {
        "from": 2,
        "to": 3,
        "thin": false
      },
      {
        "from": 3,
        "to": 4,
        "thin": false
      },
      {
        "from": 4,
        "to": 5,
        "thin": false
      },
      {
        "from": 5,
        "to": 6,
        "thin": false
      },
      {
        "from": 6,
        "to": 3,
        "thin": false
      },
      {
        "from": 6,
        "to": 7,
        "thin": true
      },
      {
        "from": 7,
        "to": 8,
        "thin": true
      },
      {
        "from": 8,
        "to": 9,
        "thin": true
      },
      {
        "from": 8,
        "to": 10,
        "thin": true
      },
      {
        "from": 5,
        "to": 11,
        "thin": true
      },
      {
        "from": 11,
        "to": 12,
        "thin": true
      },
      {
        "from": 12,
        "to": 13,
        "thin": true
      },
      {
        "from": 12,
        "to": 14,
        "thin": true
      },
      {
        "from": 11,
        "to": 15,
        "thin": true
      },
      {
        "from": 15,
        "to": 16,
        "thin": true
      },
      {
        "from": 16,
        "to": 17,
        "thin": true
      },
      {
        "from": 17,
        "to": 4,
        "thin": true
      }
    ]
  },
  {
    "code": "Ori",
    "name": "Órion",
    "note": "O caçador celeste é reconhecido pelo cinturão de três estrelas.",
    "position": [
      570,
      55
    ],
    "stars": [
      {
        "hip": 26727,
        "name": "Alnitak",
        "ra": 5.679313,
        "dec": -1.942572,
        "mag": 1.74
      },
      {
        "hip": 26311,
        "name": "Alnilam",
        "ra": 5.603559,
        "dec": -1.20192,
        "mag": 1.69
      },
      {
        "hip": 25930,
        "name": "Mintaka",
        "ra": 5.533445,
        "dec": -0.299092,
        "mag": 2.25
      },
      {
        "hip": 28691,
        "name": "64    Ori",
        "ra": 6.057602,
        "dec": 19.690561,
        "mag": 5.14
      },
      {
        "hip": 29426,
        "name": "70Xi  Ori",
        "ra": 6.198999,
        "dec": 14.208765,
        "mag": 4.45
      },
      {
        "hip": 29038,
        "name": "67Nu  Ori",
        "ra": 6.126201,
        "dec": 14.768472,
        "mag": 4.42
      },
      {
        "hip": 27913,
        "name": "54Chi1Ori",
        "ra": 5.906386,
        "dec": 20.276174,
        "mag": 4.39
      },
      {
        "hip": 28614,
        "name": "61Mu  Ori",
        "ra": 6.039722,
        "dec": 9.647276,
        "mag": 4.12
      },
      {
        "hip": 27989,
        "name": "Betelgeuse",
        "ra": 5.919529,
        "dec": 7.407063,
        "mag": 0.45
      },
      {
        "hip": 27366,
        "name": "Saiph",
        "ra": 5.795941,
        "dec": -9.669605,
        "mag": 2.07
      },
      {
        "hip": 24436,
        "name": "Rigel",
        "ra": 5.242298,
        "dec": -8.20164,
        "mag": 0.18
      },
      {
        "hip": 25336,
        "name": "Bellatrix",
        "ra": 5.418851,
        "dec": 6.349702,
        "mag": 1.64
      },
      {
        "hip": 26207,
        "name": "Meissa",
        "ra": 5.585633,
        "dec": 9.934158,
        "mag": 3.39
      },
      {
        "hip": 22449,
        "name": "Tabit",
        "ra": 4.830669,
        "dec": 6.961276,
        "mag": 3.19
      },
      {
        "hip": 22549,
        "name": "3Pi 4Ori",
        "ra": 4.853434,
        "dec": 5.605104,
        "mag": 3.68
      },
      {
        "hip": 22730,
        "name": "5    Ori",
        "ra": 4.889659,
        "dec": 2.508225,
        "mag": 5.33
      },
      {
        "hip": 23123,
        "name": "10Pi 6Ori",
        "ra": 4.975806,
        "dec": 1.714016,
        "mag": 4.47
      },
      {
        "hip": 22509,
        "name": "2Pi 2Ori",
        "ra": 4.843534,
        "dec": 8.900176,
        "mag": 4.35
      },
      {
        "hip": 22845,
        "name": "7Pi 1Ori",
        "ra": 4.914924,
        "dec": 10.150833,
        "mag": 4.64
      }
    ],
    "lines": [
      {
        "from": 0,
        "to": 1,
        "thin": false
      },
      {
        "from": 1,
        "to": 2,
        "thin": false
      },
      {
        "from": 3,
        "to": 4,
        "thin": false
      },
      {
        "from": 4,
        "to": 5,
        "thin": false
      },
      {
        "from": 5,
        "to": 6,
        "thin": false
      },
      {
        "from": 4,
        "to": 7,
        "thin": false
      },
      {
        "from": 7,
        "to": 8,
        "thin": false
      },
      {
        "from": 8,
        "to": 0,
        "thin": false
      },
      {
        "from": 0,
        "to": 9,
        "thin": false
      },
      {
        "from": 9,
        "to": 10,
        "thin": false
      },
      {
        "from": 10,
        "to": 2,
        "thin": false
      },
      {
        "from": 2,
        "to": 11,
        "thin": false
      },
      {
        "from": 11,
        "to": 12,
        "thin": false
      },
      {
        "from": 12,
        "to": 8,
        "thin": false
      },
      {
        "from": 11,
        "to": 13,
        "thin": false
      },
      {
        "from": 13,
        "to": 14,
        "thin": false
      },
      {
        "from": 14,
        "to": 15,
        "thin": false
      },
      {
        "from": 15,
        "to": 16,
        "thin": false
      },
      {
        "from": 13,
        "to": 17,
        "thin": false
      },
      {
        "from": 17,
        "to": 18,
        "thin": false
      },
      {
        "from": 5,
        "to": 7,
        "thin": false
      }
    ]
  },
  {
    "code": "Cas",
    "name": "Cassiopeia",
    "note": "Suas estrelas mais brilhantes formam o conhecido desenho em W.",
    "position": [
      340,
      275
    ],
    "stars": [
      {
        "hip": 8886,
        "name": "Segin",
        "ra": 1.906584,
        "dec": 63.670101,
        "mag": 3.35
      },
      {
        "hip": 6686,
        "name": "Ruchbah",
        "ra": 1.430216,
        "dec": 60.235283,
        "mag": 2.66
      },
      {
        "hip": 4427,
        "name": "Cih",
        "ra": 0.945143,
        "dec": 60.71674,
        "mag": 2.15
      },
      {
        "hip": 3179,
        "name": "Schedar",
        "ra": 0.675116,
        "dec": 56.537331,
        "mag": 2.24
      },
      {
        "hip": 746,
        "name": "Caph",
        "ra": 0.152887,
        "dec": 59.14978,
        "mag": 2.28
      }
    ],
    "lines": [
      {
        "from": 0,
        "to": 1,
        "thin": false
      },
      {
        "from": 1,
        "to": 2,
        "thin": false
      },
      {
        "from": 2,
        "to": 3,
        "thin": false
      },
      {
        "from": 3,
        "to": 4,
        "thin": false
      }
    ]
  },
  {
    "code": "Sco",
    "name": "Escorpião",
    "note": "Antares marca o corpo do escorpião, cuja cauda se curva pelo céu.",
    "position": [
      700,
      325
    ],
    "stars": [
      {
        "hip": 85927,
        "name": "Shaula",
        "ra": 17.560145,
        "dec": -37.103821,
        "mag": 1.62
      },
      {
        "hip": 86670,
        "name": "Kap Sco",
        "ra": 17.708132,
        "dec": -39.029983,
        "mag": 2.39
      },
      {
        "hip": 87073,
        "name": "Iot1Sco",
        "ra": 17.793078,
        "dec": -40.126997,
        "mag": 2.99
      },
      {
        "hip": 86228,
        "name": "Sargas",
        "ra": 17.62198,
        "dec": -42.997824,
        "mag": 1.86
      },
      {
        "hip": 84143,
        "name": "Eta Sco",
        "ra": 17.202552,
        "dec": -43.239189,
        "mag": 3.32
      },
      {
        "hip": 82671,
        "name": "Zet1Sco",
        "ra": 16.899924,
        "dec": -42.362025,
        "mag": 4.7
      },
      {
        "hip": 82514,
        "name": "Xamidimura",
        "ra": 16.864509,
        "dec": -38.04738,
        "mag": 3.0
      },
      {
        "hip": 82396,
        "name": "Larawag",
        "ra": 16.83608,
        "dec": -34.293232,
        "mag": 2.29
      },
      {
        "hip": 81266,
        "name": "Paikauhale",
        "ra": 16.598043,
        "dec": -28.216016,
        "mag": 2.82
      },
      {
        "hip": 80763,
        "name": "Antares",
        "ra": 16.490128,
        "dec": -26.432002,
        "mag": 1.06
      },
      {
        "hip": 78401,
        "name": "Dschubba",
        "ra": 16.005557,
        "dec": -22.62171,
        "mag": 2.29
      },
      {
        "hip": 78265,
        "name": "Fang",
        "ra": 15.980865,
        "dec": -26.114105,
        "mag": 2.89
      },
      {
        "hip": 78820,
        "name": "Acrab",
        "ra": 16.09062,
        "dec": -19.805453,
        "mag": 2.56
      }
    ],
    "lines": [
      {
        "from": 0,
        "to": 1,
        "thin": false
      },
      {
        "from": 1,
        "to": 2,
        "thin": false
      },
      {
        "from": 2,
        "to": 3,
        "thin": false
      },
      {
        "from": 3,
        "to": 4,
        "thin": false
      },
      {
        "from": 4,
        "to": 5,
        "thin": false
      },
      {
        "from": 5,
        "to": 6,
        "thin": false
      },
      {
        "from": 6,
        "to": 7,
        "thin": false
      },
      {
        "from": 7,
        "to": 8,
        "thin": false
      },
      {
        "from": 8,
        "to": 9,
        "thin": false
      },
      {
        "from": 9,
        "to": 10,
        "thin": false
      },
      {
        "from": 9,
        "to": 11,
        "thin": false
      },
      {
        "from": 9,
        "to": 12,
        "thin": false
      }
    ]
  },
  {
    "code": "Cru",
    "name": "Cruzeiro do Sul",
    "note": "Crux é reconhecida pelo eixo maior e pelo braço transversal da cruz.",
    "position": [
      120,
      470
    ],
    "stars": [
      {
        "hip": 61084,
        "name": "Gacrux",
        "ra": 12.519429,
        "dec": -57.113212,
        "mag": 1.59
      },
      {
        "hip": 60718,
        "name": "Acrux",
        "ra": 12.443311,
        "dec": -63.099092,
        "mag": 0.77
      },
      {
        "hip": 62434,
        "name": "Mimosa",
        "ra": 12.795359,
        "dec": -59.688764,
        "mag": 1.25
      },
      {
        "hip": 59747,
        "name": "Imai",
        "ra": 12.252427,
        "dec": -58.748928,
        "mag": 2.79
      }
    ],
    "lines": [
      {
        "from": 0,
        "to": 1,
        "thin": false
      },
      {
        "from": 2,
        "to": 3,
        "thin": false
      }
    ]
  },
  {
    "code": "Leo",
    "name": "Leão",
    "note": "A cabeça forma uma foice; o restante do desenho representa o corpo do leão.",
    "position": [
      420,
      495
    ],
    "stars": [
      {
        "hip": 57632,
        "name": "Denebola",
        "ra": 11.817663,
        "dec": 14.57206,
        "mag": 2.14
      },
      {
        "hip": 54879,
        "name": "Chertan",
        "ra": 11.237335,
        "dec": 15.42957,
        "mag": 3.33
      },
      {
        "hip": 49669,
        "name": "Regulus",
        "ra": 10.139532,
        "dec": 11.967207,
        "mag": 1.36
      },
      {
        "hip": 49583,
        "name": "30Eta Leo",
        "ra": 10.122209,
        "dec": 16.762664,
        "mag": 3.48
      },
      {
        "hip": 50583,
        "name": "Algieba",
        "ra": 10.332873,
        "dec": 19.841489,
        "mag": 2.01
      },
      {
        "hip": 54872,
        "name": "Zosma",
        "ra": 11.235138,
        "dec": 20.523717,
        "mag": 2.56
      },
      {
        "hip": 50335,
        "name": "Adhafera",
        "ra": 10.278171,
        "dec": 23.417311,
        "mag": 3.43
      },
      {
        "hip": 48455,
        "name": "Rasalas",
        "ra": 9.879398,
        "dec": 26.006951,
        "mag": 3.88
      },
      {
        "hip": 47908,
        "name": "Ras Elased Australis",
        "ra": 9.764188,
        "dec": 23.774255,
        "mag": 2.97
      }
    ],
    "lines": [
      {
        "from": 0,
        "to": 1,
        "thin": false
      },
      {
        "from": 1,
        "to": 2,
        "thin": false
      },
      {
        "from": 2,
        "to": 3,
        "thin": false
      },
      {
        "from": 3,
        "to": 4,
        "thin": false
      },
      {
        "from": 4,
        "to": 5,
        "thin": false
      },
      {
        "from": 5,
        "to": 0,
        "thin": false
      },
      {
        "from": 4,
        "to": 6,
        "thin": false
      },
      {
        "from": 6,
        "to": 7,
        "thin": false
      },
      {
        "from": 7,
        "to": 8,
        "thin": false
      },
      {
        "from": 5,
        "to": 1,
        "thin": false
      }
    ]
  }
];
