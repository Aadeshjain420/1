import React, { useState, useEffect } from 'react'
import QRCode from 'qrcode'

export default function App() {
  const [upiId, setUpiId] = useState('yourname@upi')
  const [name, setName] = useState('Aadesh Jain')
  const [total, setTotal] = useState(1000)
  const [parts, setParts] = useState(4)
  const [extraRule, setExtraRule] = useState(true)
  const [qrs, setQrs] = useState([])
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('qr-history') || '[]'))

  useEffect(() => { localStorage.setItem('qr-history', JSON.stringify(history)) }, [history])

  const maskUpi = (id) => {
    if(!id.includes('@')) return id
    const [a,b] = id.split('@')
    return a.slice(0,2) + '****@' + b
  }

  const splitAmount = () => {
    let t = parseFloat(total)
    let n = parseInt(parts)
    if(isNaN(t) || isNaN(n) || n<=0) return
    let base = Math.floor(t / n)
    let rem = t % n
    let arr = Array(n).fill(base)
    for(let i=0; i<rem; i++) arr[i]++

    if(extraRule && arr[arr.length-1] < 50 && arr.length > 1) {
      arr[arr.length-2] += arr[arr.length-1]
      arr.pop()
    }
    generateQrs(arr, t)
  }

  const generateQrs = async (amounts, totalAmt) => {
    const list = []
    for(let i=0; i<amounts.length; i++){
      const amt = amounts[i]
      const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amt}&cu=INR&tn=Part ${i+1} of ${amounts.length}`
      const url = await QRCode.toDataURL(upiUrl, { width: 400, margin: 2 })
      list.push({ id: Date.now()+i, amount: amt, url, upiUrl, paid: false, date: new Date().toLocaleString() })
    }
    setQrs(list)
    setHistory(h => [{ date: new Date().toLocaleString(), total: totalAmt, parts: list.length, amounts, upiId },...h].slice(0,20))
  }

  const downloadJpeg = async (qr) => {
    const canvas = document.createElement('canvas')
    canvas.width = 600; canvas.height = 750
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,600,750)
    const img = new Image(); img.src = qr.url
    await new Promise(r => img.onload = r)
    ctx.drawImage(img, 100, 120, 400, 400)
    ctx.fillStyle = '#000'; ctx.font = 'bold 28px sans-serif'
    ctx.fillText(`Rs. ${qr.amount}`, 240, 580)
    ctx.font = '16px sans-serif'; ctx.fillText(maskUpi(upiId), 220, 610)
    ctx.fillText(name, 250, 635)
    const link = document.createElement('a'); link.download = `QR-${qr.amount}.jpg`; link.href = canvas.toDataURL('image/jpeg', 0.9); link.click()
  }

  const shareAll = async () => {
    const canvas = document.createElement('canvas')
    const cols = 2; const rows = Math.ceil(qrs.length/cols)
    canvas.width = cols*620; canvas.height = rows*770
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width, canvas.height)
    for(let i=0; i<qrs.length; i++){
      const qr = qrs[i]; const x = (i%cols)*620 + 10; const y = Math.floor(i/cols)*770 + 10
      const img = new Image(); img.src = qr.url; await new Promise(r => img.onload = r)
      ctx.drawImage(img, x+100, y+100, 400, 400)
      ctx.fillStyle = '#000'; ctx.font = 'bold 24px sans-serif'; ctx.fillText(`Rs. ${qr.amount} - ${i+1}/${qrs.length}`, x+180, y+560)
    }
    const link = document.createElement('a'); link.download = `All-QRs-${total}.jpg`; link.href = canvas.toDataURL('image/jpeg', 0.9); link.click()
  }

  return (
    <div style={{fontFamily:'system-ui', maxWidth: 480, margin:'0 auto', padding: 16, background:'#f6f7fb', minHeight:'100vh'}}>
      <h2 style={{textAlign:'center'}}>💸 Dynamic UPI QR Splitter V23</h2>
      <div style={{background:'#fff', padding:16, borderRadius:12, boxShadow:'0 2px 10px #0001'}}>
        <label>UPI ID</label><input value={upiId} onChange={e=>setUpiId(e.target.value)} style={inp}/>
        <small style={{color:'#888'}}>Show as: {maskUpi(upiId)}</small>
        <label style={{marginTop:10}}>Name</label><input value={name} onChange={e=>setName(e.target.value)} style={inp}/>
        <div style={{display:'flex', gap:10}}>
          <div style={{flex:1}}><label>Total Amount</label><input type='number' value={total} onChange={e=>setTotal(e.target.value)} style={inp}/></div>
          <div style={{flex:1}}><label>No. of QRs</label><input type='number' value={parts} onChange={e=>setParts(e.target.value)} style={inp}/></div>
        </div>
        <label style={{display:'flex', gap:8, marginTop:12}}><input type='checkbox' checked={extraRule} onChange={e=>setExtraRule(e.target.checked)}/> Extra QR Rule (If last &lt; Rs.50, merge)</label>
        <button onClick={splitAmount} style={btn}>Generate Split QRs</button>
      </div>

      {qrs.length>0 && <button onClick={shareAll} style={{...btn, background:'#111'}}>📦 Share All as Single JPEG</button>}

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:16}}>
        {qrs.map((qr, i) => (
          <div key={i} style={{background:'#fff', padding:10, borderRadius:12, textAlign:'center'}}>
            <img src={qr.url} style={{width:'100%', borderRadius:8}}/>
            <b>Rs. {qr.amount}</b><div style={{fontSize:12, color:'#666'}}>{maskUpi(upiId)}</div>
            <button onClick={()=>downloadJpeg(qr)} style={{...btn, padding:'6px', fontSize:13, marginTop:6}}>Save JPEG</button>
          </div>
        ))}
      </div>

      <h3 style={{marginTop:24}}>History</h3>
      {history.map((h, i) => (
        <div key={i} style={{background: h.paid?'#e6ffec':'#fff', borderLeft: h.paid?'5px solid #16a34a':'5px solid #ef4444', padding:10, marginBottom:8, borderRadius:8}}>
          <div style={{display:'flex', justifyContent:'space-between'}}><b>Rs.{h.total} / {h.parts} QRs</b><small>{h.date}</small></div>
          <div style={{fontSize:12}}>{h.amounts?.join(' + ')} | {maskUpi(h.upiId)}</div>
        </div>
      ))}
    </div>
  )
}
const inp = {width:'100%', padding:'10px', borderRadius:8, border:'1px solid #ddd', marginTop:4, boxSizing:'border-box'}
const btn = {width:'100%', padding:'12px', background:'#2563eb', color:'#fff', border:'none', borderRadius:10, marginTop:14, fontWeight:'bold', fontSize:16}
