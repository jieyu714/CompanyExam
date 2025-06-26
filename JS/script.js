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

const totalQuestionsDisplay = document.getElementById('totalQuestions')
const remainingQuestionsDisplay = document.getElementById('remainingQuestions')

let loadingTime = 0
const mealName = new Map()
const meal = new Map()
const ingredientsTextConversion = new Map()
const mealTextConversion = new Map()
let topic = new Set()
const allTopics = new Set()
let questionSelectionNumber = 0

let userUUID = ''

function getNowTimeInformation() {
  return Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date()).replace(/,/g, '');
}

async function insertData(mode, data = []) {
  if (mode == 'Check') {
    try {
      const { error } = await supabase
        .from('companyExamInsertInformation')
        .insert([{ timeInformation: getNowTimeInformation(), user_uuid: userUUID, class: mode, name: data[0], spiceLevel: data[1], mild: data[2], sauceServedSeparately: data[3], tableware: data[4], ingredients: data[5], packagingMaterials: data[6], errorInformation: data[7] }]);
      if (error) {
        console.error('Error inserting data:', error);
      } else {
        console.log(`資料插入成功, mode: ${mode}, data:${data}`);
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error);
    }
  } else if (mode == 'Initialization') {
    try {
      const { error } = await supabase
        .from('companyExamInsertInformation')
        .insert([{ timeInformation: getNowTimeInformation(), user_uuid: userUUID, class: mode }]);

      if (error) {
        console.error('Error inserting data:', error);
      } else {
        console.log(`資料插入成功, mode: ${mode}, data:${data}`);
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error);
    }
  } else if (mode == 'Specify') {
    try {
      const { error } = await supabase
        .from('companyExamInsertInformation')
        .insert([{ timeInformation: getNowTimeInformation(), user_uuid: userUUID, class: mode, name: data[0], originalName: data[1] }]);

      if (error) {
        console.error('Error inserting data:', error);
      } else {
        console.log(`資料插入成功, mode: ${mode}, data:${data}`);
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error);
    }
  } else if (['Login', 'Logout'].includes(mode)) {
    try {
      const { error } = await supabase
        .from('companyExamInsertInformation')
        .insert([{ timeInformation: getNowTimeInformation(), user_uuid: userUUID, class: mode }]);

      if (error) {
        console.error('Error inserting data:', error);
      } else {
        console.log(`資料插入成功, mode: ${mode}, data:${data}`);
      }
    } catch (error) {
      console.error('An unexpected error occurred:', error);
    }
  }
  
  return true
}

function showLoading(titleText, htmlText = '', showConfirm = false, showCancel = false) {
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
    if (!row.discontinued) {
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
        row.packagingMaterials,
      ])

      if (!mealName.has(row.class)) {
        mealName.set(row.class, [])
      }
      mealName.get(row.class).push(row.name)
      allTopics.add(row.name)
      document.querySelector(`div[data-type="${row.class}"]`).classList.add('filled')
    }
  })
  console.log('Meal Name:', mealName)
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
  data.forEach(row => mealTextConversion.set(row.original, row.conversion))
  console.log('Meal Text Conversion:', mealTextConversion)
  return true
} 

async function importIngredientsTextConversion() {
  const { data, error } = await supabase
    .from('ingredientsTextConversion')
    .select('*')
    .order('original', { ascending: true })
  if (error) {
    console.error('資料獲取錯誤:', error)
    return
  }
  data.forEach(row => ingredientsTextConversion.set(row.original, row.conversion))
  console.log('Ingredients Text Conversion:', ingredientsTextConversion)
  return true
}

async function importData() {
  showLoading('載入中...', '請稍候...', false)

  await importMealDetails()
  await importMealTextConversion()
  await importIngredientsTextConversion()

  titleInitialization()
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

async function titleInitialization() {
  await hideLoading()
  let total = 0
  mealName.forEach(valueArray => {
    total += valueArray.length
    questionSelectionNumber += 1
    valueArray.forEach(value => {
      topic.add(value)
    })
  })
  updateQuestionNumber(total, total)
  nameDiv.textContent = Array.from(topic)[Math.floor(Math.random() * topic.size)]
  insertData('Initialization')
}

function formatConversion(str) {
  const s = /[,;，、。.！!？?\s]+/
  const arr = str.split(s).filter(Boolean)
  return arr.map(w => (ingredientsTextConversion.has(w) ? ingredientsTextConversion.get(w) : w))
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
    error += `辣度：${std[0]}(<span style="color: red">${selectedLevel}</span>)<br>`
  }

  if (spiceLevelAssessment.classList.contains('filled') && mildDiv.classList.contains('filled') !== std[1]) {
    error += `減辣：${std[1] ? 'O' : 'X'}(<span style="color: red">${mildDiv.classList.contains('filled') ? 'O' : 'X'}</span>)<br>`
  }

  if (spiceLevelAssessment.classList.contains('filled') && sauceServedSeparatelyDiv.classList.contains('filled') !== std[2]) {
    error += `過橋：${std[2] ? 'O' : 'X'}(<span style="color: red">${sauceServedSeparatelyDiv.classList.contains('filled') ? 'O' : 'X'}</span>)<br>`
  }

  if (!tablewareInput.value.trim()) {
    tablewareInput.value = '無'
  }
  if (tablewareAssessment.classList.contains('filled') && Compare(tablewareInput.value, std[4])) {
    const res = returnError(tablewareInput.value, std[4])
    error += `餐具：${res[0]}(${res[1]})<br>`
  }

  if (!ingredientsInput.value.trim()) {
    ingredientsInput.value = '無'
  }
  if (ingredientsAssessment.classList.contains('filled') && Compare(ingredientsInput.value, std[6])) {
    const res = returnError(ingredientsInput.value, std[6])
    error += `食材：${res[0]}(${res[1]})<br>`
  }

  if (!packagingMaterialsInput.value.trim()) {
    packagingMaterialsInput.value = '無'
  }
  if (packagingMaterialsAssessment.classList.contains('filled') && Compare(packagingMaterialsInput.value, std[9])) {
    const res = returnError(packagingMaterialsInput.value, std[9])
    error += `包材：${res[0]}(${res[1]})<br>`
  }

  await hideLoading()

  insertData('Check', [nameDiv.textContent, selectedLevel, mildDiv.classList.contains('filled'), sauceServedSeparatelyDiv.classList.contains('filled'), tablewareInput.value, ingredientsInput.value, packagingMaterialsInput.value, error])

  if (error) {
    showLoading('答案錯誤', error, true, false)
    console.log('答案錯誤:', error)
  } else {
    topic.delete(nameDiv.textContent)
    updateQuestionNumber(totalQuestionsDisplay.textContent, topic.size)
    console.log('回答正確:', nameDiv.textContent)
    showLoading('回答正確', '', true, true)
  }
}

async function functionChange() {
  showLoading('更換中...', '請稍候...', false, false)
  clear()
  const last = nameDiv.textContent
  nameDiv.textContent = '　'
  await hideLoading()

  if (!topic.size) {
    showLoading('測驗結束', '題目已全部完成', true, false)
    console.log('所有題目皆已完成')
    console.log('重製中')
    topic = new Set(allTopics)
    console.log(mealName.size, topic.size)
    updateQuestionNumber(topic.size, topic.size)
    nameDiv.textContent = Array.from(topic)[Math.floor(Math.random() * topic.size)]
  } else {
    do {
      nameDiv.textContent = Array.from(topic)[Math.floor(Math.random() * topic.size)]
    } while (topic.size > 1 && nameDiv.textContent === last)
  }
  console.log('題目更換為:', nameDiv.textContent)
  return true
}

function mapIncludes(a, b) {
  const arr = Array.from(a.values())
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr[i].length; j++) {
      let value = arr[i][j]
      if (value == b) {
        return true
      }
    }
  }
  return false
}

async function functionSpecify() {
  const { value: specificName } = await Swal.fire({
    title: '請輸入餐點名稱',
    input: 'text',
    inputPlaceholder: '請輸入要指定的餐點名稱...',
    showCancelButton: true,
    confirmButtonText: '確認',
    cancelButtonText: '取消',
    inputValidator: (value) => {
      if (!value) {
        return '您必須輸入餐點名稱！'
      } else if (!mapIncludes(mealName, (mealTextConversion.has(value) ? mealTextConversion.get(value) : value))) {
        insertData('Specify', ['', value])
        console.log('指定餐點名稱錯誤輸入:' + value)
        return '您輸入的餐點名稱不存在！'
      }
      return undefined
    }
  })

  console.log('指定餐點名稱:' + specificName + ' => ' + (mealTextConversion.has(specificName) ? mealTextConversion.get(specificName) : specificName))
  if (specificName) {
    insertData('Specify', [mealTextConversion.has(specificName) ? mealTextConversion.get(specificName) : specificName, specificName])
    showLoading('更換指定餐點中...', '請稍候...', false, false)
    clear()
    await hideLoading();
    nameDiv.textContent = (mealTextConversion.has(specificName) ? mealTextConversion.get(specificName) : specificName);
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

async function questionChange() {
  document.querySelectorAll('.question').forEach(el => {
  el.addEventListener('click', () => {
    if (el.classList.contains('filled')) {
      if (mealName.has(el.dataset.type)) {
        questionSelectionNumber += 1
        showLoading('題目類型新增', `已新增<strong>${el.dataset.type}</strong>的題目`, true, false)
        quantityCalculation('+', el.dataset.type)
        console.log('已點擊', el.dataset.type)
      } else {
        showLoading('錯誤', '沒有此類型的題目', true, false)
        el.classList.remove('filled')
        console.log(`沒有 ${el.dataset.type} 的題目`)
      }
    } else {
      if (questionSelectionNumber > 1) {
        questionSelectionNumber -= 1
        quantityCalculation('-', el.dataset.type)
        if (topic.size) {
          setTimeout(() => {
            showLoading('題目類型取消', `已取消<strong>${el.dataset.type}</strong>的題目`, true, false)
          }, 1300 * !topic.has(nameDiv.textContent))
        }
        if (!topic.has(nameDiv.textContent)) {
          functionChange()
        }
        console.log('已取消', el.dataset.type)
      } else {
        showLoading('錯誤', '題目類型至少需要選取一個', true, false)
        el.classList.add('filled')
        console.log(`${el.dataset.type} 取消失敗，至少須選取一個類型`)
      }
    }
  })
})
}

function quantityCalculation(a, b) {
  if (a == '+') {
    if (mealName.has(b)) {
      mealName.get(b).forEach(value => {
        topic.add(value)
        allTopics.add(value)
        updateQuestionNumber(parseInt(totalQuestionsDisplay.textContent) + 1, parseInt(remainingQuestionsDisplay.textContent) + 1)
      })
    }
  } else if (a == '-') {
    if (mealName.has(b)) {
      mealName.get(b).forEach(value => {
        if (topic.has(value)) {
          topic.delete(value)
          updateQuestionNumber(parseInt(totalQuestionsDisplay.textContent) - 1, parseInt(remainingQuestionsDisplay.textContent) - 1)
        } else {
          updateQuestionNumber(parseInt(totalQuestionsDisplay.textContent) - 1, parseInt(remainingQuestionsDisplay.textContent))
        }
        allTopics.delete(value)
      })
    }
  }
}

function updateQuestionNumber(a, b) {
  totalQuestionsDisplay.textContent = a
  remainingQuestionsDisplay.textContent = b
}

async function loginWithEmail(email, password, remember) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    console.error('登入失敗：', error.message)
    return false
  }

  userUUID = data.user.id
  console.log('登入成功的UUID:', userUUID)

  if (remember) {
    localStorage.setItem('rememberedEmail', email)
    localStorage.setItem('rememberedUUID', userUUID) 
    localStorage.setItem('rememberedTime', Date.now())
  } else {
    localStorage.removeItem('rememberedEmail')
    localStorage.removeItem('rememberedUUID')
    localStorage.removeItem('rememberedTime')
  }

  return true
}

async function showLoginDialog() {
  while (true) {
    const { value: formValues } = await Swal.fire({
      title: '登入',
      html:
        `<input type="email" id="swal-email" class="swal2-input" placeholder="Email">` +
        `<input type="password" id="swal-password" class="swal2-input" placeholder="Password">` +
        `<label style="display: flex; align-items: center; justify-content: center; margin-top: 10px;">
           <input type="checkbox" id="swal-remember" style="margin-right: 8px;">
           記得我(5天)
         </label>`,
      focusConfirm: false,
      showCancelButton: false,
      confirmButtonText: '登入',
      allowOutsideClick: false,
      preConfirm: () => {
        const email = document.getElementById('swal-email').value.trim()
        const password = document.getElementById('swal-password').value.trim()
        const remember = document.getElementById('swal-remember').checked
        if (!email || !password) {
          Swal.showValidationMessage('請輸入 Email 和密碼')
          return false
        }
        return { email, password, remember }
      }
    })

    if (!formValues) {
      return null
    }

    const loginSuccess = await loginWithEmail(formValues.email, formValues.password, formValues.remember)
    if (loginSuccess) {
      return formValues.email
    } else {
      await Swal.fire({
        icon: 'error',
        title: '登入失敗',
        text: '帳號或密碼錯誤，請重新輸入',
        confirmButtonText: '再試一次'
      })
    }
  }
}

async function functionInitialization() {
  const rememberedEmail = localStorage.getItem('rememberedEmail')
  const rememberedUUID = localStorage.getItem('rememberedUUID')
  const rememberedTime = localStorage.getItem('rememberedTime')

  const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000

  if (rememberedEmail && rememberedUUID && rememberedTime) {
    const timeDiff = Date.now() - Number(rememberedTime)
    if (timeDiff <= FIVE_DAYS_MS) {
      console.log(`使用記住的帳號自動登入: ${rememberedEmail}`)
      userUUID = rememberedUUID
    } else {
      localStorage.removeItem('rememberedEmail')
      localStorage.removeItem('rememberedUUID')
      localStorage.removeItem('rememberedTime')
      const email = await showLoginDialog()
      if (!email) {
        console.log('使用者未登入')
        return
      }
    }
  } else {
    const email = await showLoginDialog()
    if (!email) {
      console.log('使用者未登入')
      return
    }
  }

  insertData('Login')

  importData()

  document.getElementById('check').addEventListener('click', functionCheck)
  document.getElementById('change').addEventListener('click', functionChange)
  document.getElementById('specify').addEventListener('click', functionSpecify)
  document.getElementById('logout').addEventListener('click', logout)

  setupAutoClear()
  questionChange()
}

async function logout() {
  localStorage.removeItem('rememberedEmail')
  localStorage.removeItem('rememberedUUID')
  localStorage.removeItem('rememberedTime')

  await insertData('Logout')

  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('登出錯誤:', error)
  } else {
    location.reload()
  }
}

document.addEventListener('DOMContentLoaded', () => {
  functionInitialization()
})
