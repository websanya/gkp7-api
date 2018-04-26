const mongoose = require('mongoose')

const api = {}

/**
 * Методы про пациентов.
 */

api.makePatient = (Patient, Token) => (req, res) => {
  if (Token) {
    if (req.body.fio === undefined) {
      api.errorHandler(res, 'Не указаны ФИО')
    } else if (req.body.dateBirth === undefined) {
      api.errorHandler(res, 'Не указана дата рождения')
    } else if (req.body.sex === undefined) {
      api.errorHandler(res, 'Не указан пол')
    } else if (req.body.passport === undefined) {
      api.errorHandler(res, 'Не указан паспорт')
    } else if (req.body.phone === undefined) {
      api.errorHandler(res, 'Не указан номер телефона')
    } else {
      //* Создаем объект будущего пациента.
      let patient = new Patient({
        fio: req.body.fio,
        dateBirth: api.dateToIso(req.body.dateBirth),
        sex: req.body.sex,
        passport: req.body.passport,
        phone: req.body.phone
      })
      if (req.body.activeJob !== undefined) {
        patient.activeJob = req.body.activeJob
      }
      //* Сохраняем в базу данных.
      patient.save(err => {
        if (err) {
          console.log(err)
          return res.status(400).json({
            success: false,
            message: 'Ошибка при создании пациента.'
          })
        }
        res.json({
          success: true,
          message: 'Пациент создан успешно!'
        })
      })
    }
  } else return res.status(403).send({success: false, message: 'Нет доступа.'})
}

api.removePatient = (Patient, Token) => (req, res) => {
  if (Token) {
    Patient.findByIdAndRemove(req.params.patId, (err, patient) => {
      if (err) res.status(400).json(err)
      if (patient) {
        res.status(200).json({success: true, message: 'Пациент удален.'})
      } else {
        res.status(200).json({success: false, message: 'Такой пациент не найден.'})
      }
    })
  } else return res.status(403).send({success: false, message: 'Нет доступа.'})
}

api.updatePatient = (Patient, Token) => (req, res) => {
  if (Token) {
    let tempObj = {}
    if (req.body.fio !== undefined) {
      tempObj.fio = req.body.fio
    }
    if (req.body.sex !== undefined) {
      tempObj.sex = req.body.sex
    }
    if (req.body.dateBirth !== undefined) {
      tempObj.dateBirth = new Date(api.dateToIso(req.body.dateBirth))
    }
    if (req.body.passport !== undefined) {
      tempObj.passport = req.body.passport
    }
    if (req.body.phone !== undefined) {
      tempObj.phone = req.body.phone
    }
    if (req.body.activeJob !== undefined) {
      tempObj.activeJob = req.body.activeJob
    }
    if (tempObj === {}) {
      return res.status(200).json({success: false, message: 'Вы не задали параметров для обновления.'})
    }
    Patient.findByIdAndUpdate(req.params.patId, {
      $set: tempObj
    }, {
      new: true
    }, (err, patient) => {
      if (err) res.status(400).json(err)
      if (patient) {
        res.status(200).json({success: true, message: 'Пациент обновлен.', patient: patient})
      } else {
        res.status(200).json({success: false, message: 'Такой пациент не найден.'})
      }
    })
  } else return res.status(403).send({success: false, message: 'Нет доступа.'})
}

api.getPatientsByFIO = (Patient, Token) => (req, res) => {
  if (Token) {
    if (req.params.lastName || req.params.firstName || req.params.middleName) {
      let val = ''
      if (req.params.lastName !== ' ') {
        val += req.params.lastName + '[А-Я]*'
      } else {
        val += '[А-Я]*'
      }
      if (req.params.firstName !== ' ') {
        val += '\\s+' + req.params.firstName + '[А-Я]*'
      } else {
        val += '\\s+[А-Я]*'
      }
      if (req.params.middleName !== ' ') {
        val += '\\s+' + req.params.middleName + '[А-Я]*'
      } else {
        val += '\\s+[А-Я]*'
      }
      Patient.find({'fio': {$regex: new RegExp(val), $options: 'i'}}, (err, patients) => {
        if (err) res.status(400).json(err)
        if (patients.length === 0) {
          res.status(200).json({success: false, message: 'Пациенты не найдены.'})
        } else {
          res.status(200).json({success: true, patients: patients})
        }
      })
    } else {
      res.status(200).json({success: false, message: 'Пустой запрос.'})
    }
  } else return res.status(403).send({success: false, message: 'Нет доступа.'})
}

/**
 * Методы про медосмотры.
 */

api.getMedosPatientsByFIO = (Patient, Token) => (req, res) => {
  if (Token) {
    if (req.params.lastName || req.params.firstName || req.params.middleName) {
      let val = ''
      if (req.params.lastName !== ' ') {
        val += req.params.lastName + '[А-Я]*'
      } else {
        val += '[А-Я]*'
      }
      if (req.params.firstName !== ' ') {
        val += '\\s+' + req.params.firstName + '[А-Я]*'
      } else {
        val += '\\s+[А-Я]*'
      }
      if (req.params.middleName !== ' ') {
        val += '\\s+' + req.params.middleName + '[А-Я]*'
      } else {
        val += '\\s+[А-Я]*'
      }
      Patient.find({'fio': {$regex: new RegExp(val), $options: 'i'}, 'hasActiveMedos': true}, (err, patients) => {
        if (err) res.status(400).json(err)
        if (patients.length === 0) {
          res.status(200).json({success: false, message: 'Пациенты не найдены.'})
        } else {
          res.status(200).json({success: true, patients: patients})
        }
      })
    } else {
      res.status(200).json({success: false, message: 'Пустой запрос.'})
    }
  } else return res.status(403).send({success: false, message: 'Нет доступа.'})
}

api.addActiveMedos = (Patient, Token) => (req, res) => {
  let tempMedos = {
    medosType: req.body.currentMedos.medosType,
    medosJob: req.body.currentMedos.medosJob
  }
  if (Token) {
    Patient.findByIdAndUpdate(req.params.patId, {
      $set: {activeMedos: tempMedos, hasActiveMedos: true}
    }, {
      new: true
    }, (err, patient) => {
      if (err) res.status(400).json(err)
      if (patient) {
        res.status(200).json({success: true, message: 'Медосмотр добавлен.', patient: patient})
      } else {
        res.status(200).json({success: false, message: 'Такой пациент не найден.'})
      }
    })
  } else return res.status(403).send({success: false, message: 'Нет доступа.'})
}

api.updatePatientHarms = (Patient, Token) => (req, res) => {
  let tempHarms = req.body.medosHarms
  let tempDoctors = req.body.medosDoctors
  let tempExams = req.body.medosExams
  if (Token) {
    Patient.findByIdAndUpdate(req.params.patId, {
      $set: {
        'activeMedos.medosHarms': tempHarms,
        'activeMedos.medosDoctors': tempDoctors,
        'activeMedos.medosExams': tempExams
      }
    }, {
      new: true
    }, (err, patient) => {
      if (err) res.status(400).json(err)
      if (patient) {
        res.status(200).json({success: true, message: 'Вредности обновлены.', patient: patient})
      } else {
        res.status(200).json({success: false, message: 'Такой пациент не найден.'})
      }
    })
  } else return res.status(403).send({success: false, message: 'Нет доступа.'})
}

api.updatePatientParameters = (Patient, Token) => (req, res) => {
  let tempParameters = req.body.medosParameters
  if (Token) {
    Patient.findByIdAndUpdate(req.params.patId, {
      $set: {'activeMedos.medosParameters': tempParameters}
    }, {
      new: true
    }, (err, patient) => {
      if (err) res.status(400).json(err)
      if (patient) {
        res.status(200).json({success: true, message: 'Данные обновлены.', patient: patient})
      } else {
        res.status(200).json({success: false, message: 'Такой пациент не найден.'})
      }
    })
  } else return res.status(403).send({success: false, message: 'Нет доступа.'})
}

api.addDoctorResult = (Patient, Token) => (req, res) => {
  let tempDoctorResult = req.body.doctorResult
  if (Token) {
    Patient.findByIdAndUpdate(req.params.patId, {
      $push: {'activeMedos.medosDoctorResults': tempDoctorResult}
    }, {
      new: true
    }, (err, patient) => {
      if (err) res.status(400).json(err)
      if (patient) {
        res.status(200).json({success: true, message: 'Осмотр добавлен.', patient: patient})
      } else {
        res.status(200).json({success: false, message: 'Такой пациент не найден.'})
      }
    })
  } else return res.status(403).send({success: false, message: 'Нет доступа.'})
}

api.updateDoctorResult = (Patient, Token) => (req, res) => {
  let tempDoctorResult = req.body.doctorResult
  if (Token) {
    Patient.findOneAndUpdate({
      _id: req.params.patId,
      'activeMedos.medosDoctorResults._id': req.params.resultId
    }, {
      $set: {'activeMedos.medosDoctorResults.$': tempDoctorResult}
    }, {
      new: true
    }, (err, patient) => {
      if (err) res.status(400).json(err)
      if (patient) {
        res.status(200).json({success: true, message: 'Осмотр изменен.', patient: patient})
      } else {
        res.status(200).json({success: false, message: 'Такой пациент не найден.'})
      }
    })
  } else return res.status(403).send({success: false, message: 'Нет доступа.'})
}

api.addExamResult = (Patient, Token) => (req, res) => {
  let tempExamResult = req.body.examResult
  if (Token) {
    Patient.findByIdAndUpdate(req.params.patId, {
      $push: {'activeMedos.medosExamResults': tempExamResult}
    }, {
      new: true
    }, (err, patient) => {
      if (err) res.status(400).json(err)
      if (patient) {
        res.status(200).json({success: true, message: 'Обследование добавлено.', patient: patient})
      } else {
        res.status(200).json({success: false, message: 'Такой пациент не найден.'})
      }
    })
  } else return res.status(403).send({success: false, message: 'Нет доступа.'})
}

api.updateExamResult = (Patient, Token) => (req, res) => {
  let tempExamResult = req.body.examResult
  if (Token) {
    Patient.findOneAndUpdate({
      _id: req.params.patId,
      'activeMedos.medosExamResults._id': req.params.examId
    }, {
      $set: {'activeMedos.medosExamResults.$': tempExamResult}
    }, {
      new: true
    }, (err, patient) => {
      if (err) res.status(400).json(err)
      if (patient) {
        res.status(200).json({success: true, message: 'Обследование изменено.', patient: patient})
      } else {
        res.status(200).json({success: false, message: 'Такой пациент не найден.'})
      }
    })
  } else return res.status(403).send({success: false, message: 'Нет доступа.'})
}

/**
 * Методы про снимки.
 */

api.getPatientRgResults = (Patient, Token) => (req, res) => {
  if (Token) {
    Patient.findById(req.params.patId, (err, patient) => {
      if (err) res.status(400).json(err)
      if (patient) {
        if (patient.rgResults.length === 0) {
          res.status(200).json({success: false, message: 'У этого пациента нет снимков.'})
        } else {
          res.status(200).json({success: true, rgResults: patient.rgResults})
        }
      } else {
        res.status(200).json({success: false, message: 'Такого пациента не найдено.'})
      }
    })
  } else return res.status(403).send({success: false, message: 'Нет доступа.'})
}

api.registerPatientRgResult = (Patient, Token) => (req, res) => {
  if (Token) {
    let tempRgResult = req.body.activeRgResult
    tempRgResult.rgDate = api.dateToIso(tempRgResult.rgDate)
    Patient.findByIdAndUpdate(req.params.patId, {
      $set: {activeRgResult: tempRgResult, hasActiveRgResult: true}
    }, {
      new: true
    }, (err, patient) => {
      if (err) res.status(400).json(err)
      if (patient) {
        res.status(200).json({success: true, message: 'Снимок зарегистрирован.', patient: patient})
      } else {
        res.status(200).json({success: false, message: 'Такой пациент не найден.'})
      }
    })
  } else return res.status(403).send({success: false, message: 'Нет доступа.'})
}

api.finalizePatientRgResult = (Patient, Token) => (req, res) => {
  if (Token) {
    let tempRgResult = req.body.rgResult
    Patient.findByIdAndUpdate(req.params.patId, {
      $unset: {activeRgResult: true},
      $set: {hasActiveRgResult: false},
      $push: {rgResults: tempRgResult}
    }, {
      new: true
    }, (err, patient) => {
      if (err) res.status(400).json(err)
      if (patient) {
        res.status(200).json({success: true, message: 'Описание добавлено.', patient: patient})
      } else {
        res.status(200).json({success: false, message: 'Такой пациент не найден.'})
      }
    })
  } else return res.status(403).send({success: false, message: 'Нет доступа.'})
}

api.addPatientRgResult = (Patient, Token) => (req, res) => {
  if (Token) {
    let tempRgResult = req.body.rgResult
    tempRgResult.rgDate = api.dateToIso(tempRgResult.rgDate)
    Patient.findByIdAndUpdate(req.params.patId, {
      $push: {rgResults: tempRgResult}
    }, {
      new: true
    }, (err, patient) => {
      if (err) res.status(400).json(err)
      if (patient) {
        res.status(200).json({success: true, message: 'Снимок добавлен.', patient: patient})
      } else {
        res.status(200).json({success: false, message: 'Такой пациент не найден.'})
      }
    })
  } else return res.status(403).send({success: false, message: 'Нет доступа.'})
}

api.removePatientActiveRg = (Patient, Token) => (req, res) => {
  if (Token) {
    Patient.findByIdAndUpdate(req.params.patId, {
      $unset: {activeRgResult: true},
      $set: {hasActiveRgResult: false}
    }, {
      new: true
    }, (err, patient) => {
      if (err) res.status(400).json(err)
      if (patient) {
        res.status(200).json({success: true, message: 'Зарегистрированный снимок удален.', patient: patient})
      } else {
        res.status(200).json({success: false, message: 'Такой пациент не найден.'})
      }
    })
  } else return res.status(403).send({success: false, message: 'Нет доступа.'})
}

api.removePatientCertainRg = (Patient, Token) => (req, res) => {
  if (Token) {
    Patient.findByIdAndUpdate(req.params.patId, {
      $pull: {'rgResults': {_id: req.params.rgId}}
    }, {
      new: true
    }, (err, patient) => {
      if (err) res.status(400).json(err)
      if (patient) {
        res.status(200).json({success: true, message: 'Зарегистрированный снимок удален.', patient: patient})
      } else {
        res.status(200).json({success: false, message: 'Такой пациент не найден.'})
      }
    })
  } else return res.status(403).send({success: false, message: 'Нет доступа.'})
}

/**
 * Методы про анализы.
 */

api.addPatientAnalyze = (Patient, Token) => (req, res) => {
  if (Token) {
    const analyzeResult = req.body.analyzeResult
    let analyzeArray = ''
    switch (req.body.analyzeType) {
      case 'blood':
        analyzeResult.bloodDate = api.dateToIso(analyzeResult.bloodDate)
        analyzeArray = 'bloodResults'
        break
      case 'urineClinical':
        analyzeResult.urineDate = api.dateToIso(analyzeResult.urineDate)
        analyzeArray = 'urineClinicalResults'
        break
    }
    let push = {$push: {}}
    push.$push[analyzeArray] = analyzeResult
    Patient.findByIdAndUpdate(req.params.patId, push, {
      new: true
    }, (err, patient) => {
      if (err) res.status(400).json(err)
      if (patient) {
        res.status(200).json({success: true, message: 'Анализ добавлен.', patient: patient})
      } else {
        res.status(200).json({success: false, message: 'Такой пациент не найден.'})
      }
    })
  } else return res.status(403).send({success: false, message: 'Нет доступа.'})
}

api.editPatientAnalyze = (Patient, Token) => (req, res) => {
  if (Token) {
    let analyzeResult = req.body.analyzeResult
    switch (req.body.analyzeType) {
      case 'blood':
        analyzeResult.bloodDate = api.dateToIso(analyzeResult.bloodDate)
        Patient.findOneAndUpdate({
          _id: req.params.patId,
          'bloodResults._id': req.params.analyzeId
        }, {
          $set: {
            'bloodResults.$': analyzeResult
          }
        }, {
          new: true
        }, (err, patient) => {
          if (err) res.status(400).json(err)
          if (patient) {
            res.status(200).json({success: true, message: 'Анализ крови изменен.', patient: patient})
          } else {
            res.status(200).json({success: false, message: 'Такой пациент не найден.'})
          }
        })
        break
      case 'urineClinical':
        analyzeResult.urineDate = api.dateToIso(analyzeResult.urineDate)
        Patient.findOneAndUpdate({_id: req.params.patId, 'urineClinicalResults._id': req.params.analyzeId}, {
          $set: {
            'urineClinicalResults.$': analyzeResult
          }
        }, {
          new: true
        }, (err, patient) => {
          if (err) res.status(400).json(err)
          if (patient) {
            res.status(200).json({success: true, message: 'Анализ мочи изменен.', patient: patient})
          } else {
            res.status(200).json({success: false, message: 'Такой пациент не найден.'})
          }
        })
        break
    }
  } else return res.status(403).send({success: false, message: 'Нет доступа.'})
}

api.removePatientAnalyze = (Patient, Token) => (req, res) => {
  if (Token) {
    let analyzeArray = ''
    switch (req.body.analyzeType) {
      case 'blood':
        analyzeArray = 'bloodResults'
        break
      case 'urineClinical':
        analyzeArray = 'urineClinicalResults'
        break
    }
    let pull = {$pull: {}}
    pull.$pull[analyzeArray] = {_id: req.params.analyzeId}
    Patient.findByIdAndUpdate(req.params.patId, pull, {
      new: true
    }, (err, patient) => {
      if (err) res.status(400).json(err)
      if (patient) {
        res.status(200).json({success: true, message: 'Анализ удален.', patient: patient})
      } else {
        res.status(200).json({success: false, message: 'Такой пациент не найден.'})
      }
    })
  } else return res.status(403).send({success: false, message: 'Нет доступа.'})
}

/**
 * Методы про прививки.
 */

api.addVaccine = (Patient, Token) => (req, res) => {
  if (Token) {
    Patient.findByIdAndUpdate(req.body._id, {
      $push: {
        vaccines: req.body.newVaccine
      }
    }, {new: true}, (err, updatedPatient) => {
      if (err) res.status(400).json(err)
      res.status(200).send({success: true, updatedPatient: updatedPatient})
    })
  } else return res.status(403).send({success: false, message: 'Нет доступа.'})
}

api.getVaccineById = (Patient, Token) => (req, res) => {
  if (Token) {
    Patient.findOne({'vaccines._id': req.params.vacId}, (err, vaccine) => {
      if (err) res.status(400).json(err)
      if (vaccine) {
        res.status(200).json(vaccine.vaccines.id(req.params.vacId))
      } else {
        res.status(400).json({success: false, message: 'Такой прививки не существует.'})
      }
    })
  } else return res.status(403).send({success: false, message: 'Нет доступа.'})
}

api.updateVaccineById = (Patient, Token) => (req, res) => {
  // if (Token) {
  //   Patient.findOneAndUpdate({'vaccines._id': req.body.vaccine_id}, {
  //     $set: {
  //       'vaccines.$.type': req.body.vaccine_type,
  //       'vaccines.$.content': req.body.vaccine_content
  //     }
  //   }, {new: true}, (err, updatedVaccine) => {
  //     if (err) res.status(400).json(err)
  //     res.status(200).json(updatedVaccine.vaccines.id(req.body.vaccine_id))
  //   })
  // } else return res.status(403).send({success: false, message: 'Нет доступа.'})
}

api.getVaccinesById = (Patient, Token) => (req, res) => {
  if (Token) {
    Patient.findById(req.params.patId, (err, patient) => {
      if (err) res.status(400).json(err)
      if (patient) {
        if (patient.vaccines.length === 0) {
          res.status(200).json({success: false, message: 'У этого пациента нет прививок.'})
        } else {
          res.status(200).json({success: true, vaccines: patient.vaccines})
        }
      } else {
        res.status(200).json({success: false, message: 'Такого пациента не найдено.'})
      }
    })
  } else return res.status(403).send({success: false, message: 'Нет доступа.'})
}

api.errorHandler = (res, msg) => {
  res.json({
    success: false,
    message: msg
  })
}

api.dateToIso = (input) => {
  //* Переводим дату из формата dd.mm.yyyy в yyyy-mm-dd.
  const inputDate = input
  const pattern = /(\d{2})\.(\d{2})\.(\d{4})/
  return inputDate.replace(pattern, '$3-$2-$1')
}

module.exports = api
