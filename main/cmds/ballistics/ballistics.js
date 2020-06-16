async function getBallistics(shell_data, range, ship_name) {

  // SHELL CONSTANTS //

  var C = 0.5561613 // PENETRATION
  var a = 9.81 // GRAVITY
  var T_0 = 288 // TEMPERATURE AT SEA LEVEL
  var L = 0.0065 // TEMPERATURE LAPSE RATE
  var p_0 = 101325 // PRESSURE AT SEA LEVEL
  var R = 8.31447 // UNIV GAS CONSTANT
  var M = 0.0289644 // MOLAR MASS OF AIR

  // SHELL CONSTANTS //

  var W = shell_data.bulletMass // SHELL WEIGHT
  var D = shell_data.bulletDiametr // SHELL DIAMETER
  var c_D = shell_data.bulletAirDrag // SHELL DRAG
  var V_0 = shell_data.bulletSpeed // SHELL MUZZLE VELOCITY
  var K = shell_data.bulletKrupp // SHELL KRUPP

  var cw_1 = 1 // QUADRATIC DRAG COEFFICIENT
  var cw_2 = 100 + 1000 / 3 * D // LINEAR DRAG COEFFICIENT

  C = C * K / 2400 // KRUPP INCLUSION
  var k = 0.5 * c_D * Math.pow((D / 2), 2) * Math.PI / W // CONSTANTS TERMS OF DRAG

  const kRANGE = range // TEMPORARY RANGE: 20KM

  // var alpha = [0: 0.001: 15 / 360 * 2 * Math.PI] // ELEV.ANGLES 0.. .15
  var alpha = []

  for (var i = 0; i <= 25; i += 0.1) {
    alpha.push(i / 180 * Math.PI)
  }

  var dt = 0.2 // TIME STEP

  var armor = []
  var distance = []
  var time = []

  for (i = 1; i < alpha.length; i++) { // for each alpha angle do :

    var v_x = Math.cos(alpha[i]) * V_0
    var v_y = Math.sin(alpha[i]) * V_0
    var y = 0
    var x = 0
    var t = 0

    while (y >= 0) { // follow flight path until shell hits ground again

      x = x + dt * v_x
      y = y + dt * v_y

      var T = T_0 - L * y
      var p = p_0 * Math.pow((1 - L * y / T_0), (a * M / (R * L)))
      var rho = p * M / (R * T)

      v_x = v_x - dt * k * rho * (cw_1 * Math.pow(v_x, 2) + cw_2 * v_x)
      v_y = v_y - dt * a - dt * k * rho * (cw_1 * Math.pow(v_y, 2) + cw_2 * Math.abs(v_y)) * Math.sign(v_y)

      t = t + dt

    }

    var v_total = Math.pow((Math.pow(v_y, 2) + Math.pow(v_x, 2)), 0.5)
    var p_athit = C * Math.pow(v_total, 1.1) * Math.pow(W, 0.55) / Math.pow((D * 1000), 0.65) // PENETRATION FORMULA
    var IA = Math.atan(Math.abs(v_y) / Math.abs(v_x)) // IMPACT ANGLE ON BELT ARMOR

    armor[i] = Math.cos(IA) * p_athit
    distance[i] = x
    time[i] = t / 3

    if (x > kRANGE) break
  }

  return {distance, armor, time}

}

exports.getBallistics = getBallistics
