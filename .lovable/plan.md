

# Graafikule boti tegevuste markerid + wallet suuruse muutmine

## Ulevaade
Lisame graafikule koik boti tegevused (BUY_LONG, SELL_SHORT, DCA_LONG, DCA_SHORT, CLOSE_LONG, CLOSE_SHORT) erinevate varvidega, ning teeme initial wallet suuruse muutmise parema UX-iga koos automaatse umberarvutamisega.

## Muudatused

### 1. Graafiku markerid koigi tegevuste jaoks
Praegu naitab graafik ainult BUY ja SELL punkte. Laiendame seda koigi boti tegevustega:

| Tegevus | Varv | Marker |
|---------|------|--------|
| BUY_LONG | Roheline | Ules-nool |
| CLOSE_LONG | Punane | Alla-nool |
| SELL_SHORT | Oranž | Alla-nool |
| CLOSE_SHORT | Sinine | Ules-nool |
| DCA_LONG | Heleroheline | + marker |
| DCA_SHORT | Heleoranž | + marker |

Iga marker lisatakse graafikule Scatter komponendina eraldi dataKey-ga.

### 2. Wallet suuruse muutmine (parem UX)
- Suurem, selgem input vaartuse jaoks (praegu on vaike 16px lai input)
- Salvesta localStorage-sse (juba olemas)
- "Reset" nupp mis paneb tagasi vaikimisi vaartuse (10,000 USDT)
- Selge label "Starting Balance"

### 3. Umberarvutamise loogika
Kui wallet suurus muutub:
- Koik PnL summad arvutatakse umbert uue algbalansi jargi
- Balance = initialWallet + (summa koigist PnL protsentidest * initialWallet / 100)
- Stats kaardid uuenevad kohe
- Equity kurv arvutatakse uuesti (iga trade jargi jooksev balanss)

### 4. Jooksva balansi kurv (equity curve)
Lisame graafikule teise Y-telje (paremal), mis naitab jooksvat portfelli vaartust. See arvutatakse:
- Algus = initialWallet
- Iga CLOSE_LONG/CLOSE_SHORT trade jargi: balance += pnl% * balance / 100

---

## Tehnilised detailid

### Fail: `src/pages/Index.tsx`

**Enriched logs loogika** - laiendame dataKey-sid:
```
enrichedLogs = logs.map(log => ({
  ...log,
  buyLongPoint: action contains 'BUY' ? price : null,
  closeLongPoint: action === 'CLOSE_LONG' ? price : null,
  sellShortPoint: action === 'SELL_SHORT' ? price : null,
  closeShortPoint: action === 'CLOSE_SHORT' ? price : null,
  dcaLongPoint: action === 'DCA_LONG' ? price : null,
  dcaShortPoint: action === 'DCA_SHORT' ? price : null,
  runningBalance: calculated running equity
}))
```

**Graafiku Scatter komponendid** - 6 eraldi Scatter-it iga tegevuse tarvis eri varvidega.

**Wallet input** - asendame praeguse vaelse inputi korraliku sektsiooniga headeris: label, suurem input, USDT suffix, reset nupp.

**Running balance arvutus** - loopime labi koik logid kronoloogilises jarjekorras, hoides jooksvat balanssi ja arvutades iga sulgemistehingu juures uue vaartuse PnL% pohjal.

**Stats umberarvutus** - koik statsid (balance, pnlAmount, winRate) arvutatakse initialBalance pohjal, nagu praegu, aga arvestades koiki close-tegevusi (CLOSE_LONG, CLOSE_SHORT), mitte ainult SELL.

### Fail: `src/components/dashboard/PortfolioStats.tsx`
- Lisame P/L % arvutuse initialBalance pohjal (mitte hardcoded 10,000)
- Props kaudu saab initialBalance vaartuse

