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

function showLoading(titleText, htmlText, showConfirmButtonBool) {
  loadingTime = Date.now()
  Swal.fire({
    title: titleText,
    html: htmlText,
    allowOutsideClick: false,
    showConfirmButton: showConfirmButtonBool,
    didOpen: () => {
      if (!showConfirmButtonBool) {
        Swal.showLoading()
      }
    }
  })
}

function hideLoading() {
  return new Promise(resolve => {
    setTimeout(() => {
      Swal.close();
      const clickableElements = document.querySelectorAll('button, .clickable-hours');
      clickableElements.forEach(element => {
        element.disabled = false;
      });
      resolve();
    }, Math.max(0, 1000 - (Date.now() - loadingTime)));
  });
}

peppers.forEach(p => {
  p.addEventListener('click', () => {
    selectedLevel = Number(p.dataset.level)
    const levelClicked = Number(p.dataset.level)
    peppers.forEach(pe => {
      const level = Number(pe.dataset.level)
      pe.src = level <= levelClicked ? ON_SRC : OFF_SRC
    })
  })
})

clearPepperBtn.addEventListener('click', () => {
  selectedLevel = 0
  peppers.forEach(p => p.src = OFF_SRC)
})

const squares = document.querySelectorAll('.square')
squares.forEach(sq => {
  sq.addEventListener('click', () => {
    sq.classList.toggle('filled')
  })
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
  for (let i = 0; i < data.length; i++) {
    mealName.push(data[i].name)
    meal.set(data[i].name, [
      data[i].spiceLevel,
      data[i].mild,
      data[i].sauceServedSeparately,
      data[i].utensils,
      data[i].tableware,
      data[i].condiments,
      data[i].ingredients,
      data[i].allergens,
      data[i].servingTerms,
      data[i].packagingMaterials
    ])
  }
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
  for (let i = 0; i < data.length; i++) {
    textConversion.set(data[i].original, data[i].conversion)
  }
  return true
}

async function importData() {
  showLoading('載入中...', '請稍候...', false)

  await importMealDetails()
  await importMealTextConversion()

  functionInitialization()
}

function clear() {
  peppers.forEach(pe => {
    pe.src = OFF_SRC
  })
  selectedLevel = 0
  tablewareInput.value = ''
  ingredientsInput.value = ''
  packagingMaterialsInput.value = ''
  mildDiv.classList.remove('filled')
  sauceServedSeparatelyDiv.classList.remove('filled')
}

function functionInitialization() {
  hideLoading()
  nameDiv.innerHTML = mealName[Math.floor(Math.random() * mealName.length)]
}

function formatConversion(object) {
  const s = /[,;，、。.！!？?\s]+/
  object = object.split(s).filter(Boolean)
  
  for (let i = 0; i < object.length; i++) {
    if (textConversion.has(object[i])) {
      object[i] = textConversion.get(object[i])
    }
  }
  return object
}

function returnError(object1, object2) {
  object1 = formatConversion(object1);
  object2 = formatConversion(object2);
  let a = '';
  let b = '';

  for (let i = 0; i < object2.length; i++) {
    if (object1.includes(object2[i])) {
      if (a) {
        a += `、<span style="color: blue">${object2[i]}</span>`;
      } else {
        a += `<span style="color: blue">${object2[i]}</span>`;
      }
      object1.splice(object1.indexOf(object2[i]), 1);
    } else {
      if (a) {
        a += `、<span style="color: red">${object2[i]}</span>`;
      } else {
        a += `<span style="color: red">${object2[i]}</span>`;
      }
    }
  }

  for (let i = 0; i < object1.length; i++) {
    if (b) {
      b += `、<span style="color: red">${object1[i]}</span>`;
    } else {
      b += `<span style="color: red">${object1[i]}</span>`;
    }
  }

  return [a, b];
}

function Compare(object1, object2) {
  object1 = formatConversion(object1)
  object2 = formatConversion(object2)
  for (let i = 0; i < object2.length; i++) {
    if (object1.includes(object2[i])) {
      object1 = object1.filter(item => item !== object2[i])
      object2 = object2.filter(item => item !== object2[i])
      i--
    }
  }
  return object1.length + object2.length
}

async function functionCheck() {
  showLoading('確認中...', '', false)
  let error = ""
  if (spiceLevelAssessment.classList.contains('filled') && selectedLevel != meal.get(nameDiv.textContent)[0]) {
    error += `辣度：${meal.get(nameDiv.textContent)[0]}(<span style=\"color: red\">${selectedLevel}</span>)<br>`
  }
  if (spiceLevelAssessment.classList.contains('filled') && mildDiv.classList.contains('filled') != meal.get(nameDiv.textContent)[1]) {
    error += `減辣：${meal.get(nameDiv.textContent)[1] ? 'O' : 'X'}(<span style=\"color: red\">${mildDiv.classList.contains('filled') ? 'O' : 'X'}</span>)<br>`
  }
  if (spiceLevelAssessment.classList.contains('filled') && sauceServedSeparatelyDiv.classList.contains('filled') != meal.get(nameDiv.textContent)[2]) {
    error += `過橋：${meal.get(nameDiv.textContent)[2] ? 'O' : 'X'}(<span style=\"color: red\">${sauceServedSeparatelyDiv.classList.contains('filled') ? 'O' : 'X'}</span>)<br>`
  }
  if (tablewareInput.value == '') {
    tablewareInput.value = '無'
  }
  if (tablewareAssessment.classList.contains('filled') && Compare(tablewareInput.value, meal.get(nameDiv.textContent)[4])) {
    let res = returnError(tablewareInput.value, meal.get(nameDiv.textContent)[4])
    error += `餐具：${res[0]}(${res[1]})<br>`
  }
  if (ingredientsInput.value == '') {
    ingredientsInput.value = '無'
  }
  if (ingredientsAssessment.classList.contains('filled') && Compare(ingredientsInput.value, meal.get(nameDiv.textContent)[6])) {
    let res = returnError(ingredientsInput.value, meal.get(nameDiv.textContent)[6])
    error += `食材：${res[0]}(${res[1]})<br>`
  }
  if (packagingMaterialsInput.value == '') {
    packagingMaterialsInput.value = '無'
  }
  if (packagingMaterialsAssessment.classList.contains('filled') && Compare(packagingMaterialsInput.value, meal.get(nameDiv.textContent)[9])) {
    let res = returnError(packagingMaterialsInput.value, meal.get(nameDiv.textContent)[9])
    error += `包材：${res[0]}(${res[1]})<br>`
  }
  await hideLoading()
  
  if (error) {
    showLoading('答案錯誤', error, true)
  } else {
    showLoading('回答正確', '', true)
  }
}

async function functionChange() {
  showLoading('更換中...', '請稍候...', false)

  clear()
  nameDiv.innerHTML = '　'

  await hideLoading()

  const last = nameDiv.textContent
  while (nameDiv.textContent == last) {
    nameDiv.innerHTML = mealName[Math.floor(Math.random() * mealName.length)]
  }
}

document.addEventListener('DOMContentLoaded', () => {
  importData()
  document.getElementById('check').addEventListener('click', functionCheck)
  document.getElementById('change').addEventListener('click', functionChange)
})
