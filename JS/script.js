import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://mdspsmxwitbczvfwzpiu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kc3BzbXh3aXRiY3p2Znd6cGl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjMwNDUsImV4cCI6MjA2Mjg5OTA0NX0.2sb9ReFc7T2sqjcTGrzPK_til3XcZVNBgcb4UzGegM4'
const supabase = createClient(supabaseUrl, supabaseKey)

const peppers = document.querySelectorAll('.pepper')
const clearPepperBtn = document.getElementById('clear-pepper')
const OFF_SRC = 'IMAGE/辣椒_無點擊.png'
const ON_SRC = 'IMAGE/辣椒_有點擊.png'

const nameDiv = document.getElementById('name')
const mildDiv = document.getElementById('mild')
const sauceServedSeparatelyDiv = document.getElementById('sauceServedSeparately')

let selectedLevel = 0

const tablewareInput = document.getElementById('tableware')
const ingredientsInput = document.getElementById('ingredients')
const packagingMaterialsInput = document.getElementById('packagingMaterials')

const spiceLevelAssessment = document.getElementById('assessmentSpiceLevel')
const tablewareAssessment = document.getElementById('assessmentTableware')
const ingredientsAssessment = document.getElementById('assessmentIngredients')
const packagingMaterialsAssessment = document.getElementById('assessmentPackagingMaterials')

let loadingTime = 0
const mealName = []
const meal = new Map()
const textConversion = new Map()

function showLoading(
  titleText,
  htmlText = '',
  showConfirm = false,
  showCancel = false
) {
  loadingTime = Date.now()
  Swal.fire({
    title: titleText,
    html: htmlText,
    allowOutsideClick: false,
    showConfirmButton: showConfirm,
    showCancelButton: showCancel,
    confirmButtonText: 'ok',
    cancelButtonText: 'change',
    reverseButtons: true,
    didOpen: () => {
      if (!showConfirm) {
        Swal.showLoading()
      }
    }
  }).then(result => {
    if (result.dismiss === Swal.DismissReason.cancel) {
      functionChange()
    }
  })
}

function hideLoading() {
  return new Promise(resolve => {
    setTimeout(() => {
      Swal.close()
      document.querySelectorAll('button, .clickable-hours').forEach(el => {
        el.disabled = false
      })
      resolve()
    }, Math.max(0, 1000 - (Date.now() - loadingTime)))
  })
}

peppers.forEach(p => {
  p.addEventListener('click', () => {
    selectedLevel = Number(p.dataset.level)
    const levelClicked = selectedLevel
    peppers.forEach(pe => {
      pe.src = Number(pe.dataset.level) <= levelClicked ? ON_SRC : OFF_SRC
    })
  })
})

clearPepperBtn.addEventListener('click', () => {
  selectedLevel = 0
  peppers.forEach(p => (p.src = OFF_SRC))
})

const squares = document.querySelectorAll('.square')
squares.forEach(sq => {
  sq.addEventListener('click', () => sq.classList.toggle('filled'))
})

async function importMealDetails() {
  const { data, error } = await supabase
    .from('mealDetails')
    .select('*')
    .order('class', { ascending: true })
  if (error) {
    console.error('資料獲取錯誤:', error)
    return
  }
  data.forEach(row => {
    mealName.push(row.name)
    meal.set(row.name, [
      row.spiceLevel,
      row.mild,
      row.sauceServedSeparately,
      row.utensils,
      row.tableware,
      row.condiments,
      row.ingredients,
      row.allergens,
      row.servingTerms,
      row.packagingMaterials
    ])
  })
  return true
}

async function importMealTextConversion() {
  const { data, error } = await supabase
    .from('mealTextConversion')
    .select('*')
    .order('original', { ascending: true })
  if (error) {
    console.error('資料獲取錯誤:', error)
    return
  }
  data.forEach(row => textConversion.set(row.original, row.conversion))
  return true
}

async function importData() {
  showLoading('載入中...', '請稍候...', false)

  await importMealDetails()
  await importMealTextConversion()

  functionInitialization()
}

function clear() {
  peppers.forEach(pe => (pe.src = OFF_SRC))
  selectedLevel = 0
  tablewareInput.value = ''
  ingredientsInput.value = ''
  packagingMaterialsInput.value = ''
  mildDiv.classList.remove('filled')
  sauceServedSeparatelyDiv.classList.remove('filled')
}

async function functionInitialization() {
  await hideLoading()
  nameDiv.textContent =
    mealName[Math.floor(Math.random() * mealName.length)] || ''
}

function formatConversion(str) {
  const s = /[,;，、。.！!？?\s]+/
  const arr = str.split(s).filter(Boolean)
  return arr.map(w => (textConversion.has(w) ? textConversion.get(w) : w))
}

function returnError(input, standard) {
  const arrInput = formatConversion(input)
  const arrStd = formatConversion(standard)

  let correct = ''
  let missing = ''

  arrStd.forEach(word => {
    if (arrInput.includes(word)) {
      correct += correct ? `、<span style="color: blue">${word}</span>` : `<span style="color: blue">${word}</span>`
      arrInput.splice(arrInput.indexOf(word), 1)
    } else {
      correct += correct ? `、<span style="color: red">${word}</span>` : `<span style="color: red">${word}</span>`
    }
  })

  missing = arrInput
    .map(word => `<span style="color: red">${word}</span>`)
    .join('、')

  return [correct, missing]
}

function Compare(a, b) {
  let arrA = formatConversion(a)
  let arrB = formatConversion(b)
  arrB.forEach(word => {
    if (arrA.includes(word)) {
      arrA = arrA.filter(item => item !== word)
      arrB = arrB.filter(item => item !== word)
    }
  })
  return arrA.length + arrB.length
}

async function functionCheck() {
  showLoading('確認中...', '', false)

  let error = ''
  const std = meal.get(nameDiv.textContent)

  if (spiceLevelAssessment.classList.contains('filled') && selectedLevel !== std[0]) {
    error += `辣度：${std[0]}(<span style=\"color: red\">${selectedLevel}</span>)<br>`
  }
  if (
    spiceLevelAssessment.classList.contains('filled') &&
    mildDiv.classList.contains('filled') !== std[1]
  ) {
    error += `減辣：${std[1] ? 'O' : 'X'}(<span style=\"color: red\">${
      mildDiv.classList.contains('filled') ? 'O' : 'X'
    }</span>)<br>`
  }
  if (
    spiceLevelAssessment.classList.contains('filled') &&
    sauceServedSeparatelyDiv.classList.contains('filled') !== std[2]
  ) {
    error += `過橋：${std[2] ? 'O' : 'X'}(<span style=\"color: red\">${
      sauceServedSeparatelyDiv.classList.contains('filled') ? 'O' : 'X'
    }</span>)<br>`
  }

  if (!tablewareInput.value.trim()) tablewareInput.value = '無'
  if (
    tablewareAssessment.classList.contains('filled') &&
    Compare(tablewareInput.value, std[4])
  ) {
    const res = returnError(tablewareInput.value, std[4])
    error += `餐具：${res[0]}(${res[1]})<br>`
  }

  if (!ingredientsInput.value.trim()) ingredientsInput.value = '無'
  if (
    ingredientsAssessment.classList.contains('filled') &&
    Compare(ingredientsInput.value, std[6])
  ) {
    const res = returnError(ingredientsInput.value, std[6])
    error += `食材：${res[0]}(${res[1]})<br>`
  }

  if (!packagingMaterialsInput.value.trim()) packagingMaterialsInput.value = '無'
  if (
    packagingMaterialsAssessment.classList.contains('filled') &&
    Compare(packagingMaterialsInput.value, std[9])
  ) {
    const res = returnError(packagingMaterialsInput.value, std[9])
    error += `包材：${res[0]}(${res[1]})<br>`
  }

  await hideLoading()

  if (error) {
    showLoading('答案錯誤', error, true, false)
  } else {
    showLoading('回答正確', '', true, true)
  }
}

async function functionChange() {
  showLoading('更換中...', '請稍候...', false)
  clear()
  nameDiv.textContent = '　'
  await hideLoading()

  const last = nameDiv.textContent
  while (nameDiv.textContent === last) {
    nameDiv.textContent = mealName[Math.floor(Math.random() * mealName.length)]
  }
}

function setupAutoClear() {
  document.querySelectorAll('.autoClear').forEach(input => {
    const clearIfNone = () => {
      if (input.value.trim() === '無') input.value = ''
    }
    input.addEventListener('mousedown', clearIfNone)
    input.addEventListener('focus', clearIfNone)
  })
}

document.addEventListener('DOMContentLoaded', () => {
  importData()
  document.getElementById('check').addEventListener('click', functionCheck)
  document.getElementById('change').addEventListener('click', functionChange)
  setupAutoClear()
})
