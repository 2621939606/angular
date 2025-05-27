
function getCharWidthInRem(char, fontFamily = null) {
  // 1. 获取html元素的font-size（1rem的像素值）
  const html = document.documentElement;
  const remValue = parseFloat(getComputedStyle(html).fontSize);
  
  // 2. 测量字符的像素宽度
  const span = document.createElement('span');
  span.style.visibility = 'hidden';
  span.style.whiteSpace = 'nowrap';
  span.style.position = 'absolute';
  if (fontFamily) span.style.fontFamily = fontFamily;
  span.textContent = char;
  document.body.appendChild(span);
  
  const pixelWidth = span.getBoundingClientRect().width;
  document.body.removeChild(span);
  
  // 3. 将像素值转换为rem
  return pixelWidth / remValue;
}

// 使用示例
const halfWidthRem = getCharWidthInRem('A');  // 半角字符rem宽度
const fullWidthRem = getCharWidthInRem('中'); // 全角字符rem宽度
