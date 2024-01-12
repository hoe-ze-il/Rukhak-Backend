export function generateCartItemHTML(cartItem) {
  return `
    <tr>
    <td style="padding: 10px; border: 1px solid #ddd">
      ${cartItem.productTitle}
    </td>
    <td style="padding: 10px; border: 1px solid #ddd">
      ${cartItem.quantity}
    </td>
    <td style="padding: 10px; border: 1px solid #ddd">
      $${cartItem.itemPrice.toFixed(2)}
    </td>
    <td style="padding: 10px; border: 1px solid #ddd">
      $${(cartItem.itemPrice * cartItem.quantity).toFixed(2)}
    </td>
    <td style="padding: 10px; border: 1px solid #ddd">
      <img src="${
        cartItem.url
      }" alt="Product Image" style="width: 50px; height: 50px;">
    </td>
  </tr>
  
    `;
}

export function generateCartItemHTMLRow(cartItem) {
  return `
  <div style="display: flex; align-items: center; margin-bottom: 8px;">
    <img src="${
      cartItem.url
    }" alt="Product Image" style="width: 100px; height: 100px; margin: auto 10px;">
 
    <div style="flex: 1">
      <p>${cartItem.productDes}</p>
      <p>Quantity: ${cartItem._doc.quantity}</p>
      <p>Total Price: $${(
        cartItem._doc.itemPrice * cartItem._doc.quantity
      ).toFixed(2)}</p>
    </div>
</div>
  `;
}
export function cancelledRow(cartItem) {
  return `
  <tr>
    <td> ${cartItem.productTitle}</td>
    <td>${cartItem._doc.quantity}</td>
    <td>$${cartItem.itemPrice.toFixed(2)}</td>
    <td>$${(cartItem.itemPrice * cartItem._doc.quantity).toFixed(2)}</td>
  </tr>
  `;
}
