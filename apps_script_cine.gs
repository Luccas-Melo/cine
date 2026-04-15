function doGet(e) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var action = e.parameter.action;
    
    // === GET FILMES ===
    if (action === "getMovies") {
      var sheet = spreadsheet.getSheetByName("Filmes");
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
      }
      
      var rows = sheet.getDataRange().getValues();
      var dados = [];
      
      // Começa da linha 2 (ignora cabeçalho)
      for (var i = 1; i < rows.length; i++) {
        var row = rows[i];
        var id = row[0];
        
        if (id && !isNaN(parseInt(id))) {
          dados.push({
            id: parseInt(id),
            title: row[1] || "",
            year: row[2] || "",
            genre: row[3] || "",
            poster: row[4] || "",
            description: row[5] || ""
          });
        }
      }
      
      var output = ContentService.createTextOutput(JSON.stringify(dados));
      output.setMimeType(ContentService.MimeType.JSON);
      return output;
    }
    
    // === GET AVALIAÇÕES ===
    if (action === "getReviews") {
      var sheet = spreadsheet.getSheetByName("Avaliacoes");
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
      }
      
      var rows = sheet.getDataRange().getValues();
      var dados = [];
      
      for (var i = 1; i < rows.length; i++) {
        var row = rows[i];
        var id = row[0];
        
        if (id && !isNaN(parseInt(id))) {
          dados.push({
            id: parseInt(id),
            movieId: parseInt(row[1]) || 0,
            rating: parseInt(row[2]) || 0,
            userName: row[3] || "",
            text: row[4] || "",
            date: row[5] || ""
          });
        }
      }
      
      var output = ContentService.createTextOutput(JSON.stringify(dados));
      output.setMimeType(ContentService.MimeType.JSON);
      return output;
    }
    
    // === DELETE FILME ===
    if (action === "deleteMovie") {
      var sheet = spreadsheet.getSheetByName("Filmes");
      if (!sheet) return ContentService.createTextOutput("NOT_FOUND");

      var idToDelete = e.parameter.id;
      var rows = sheet.getDataRange().getValues();
      for (var i = rows.length - 1; i >= 1; i--) {
        var cellId = rows[i][0] ? rows[i][0].toString() : "";
        if (cellId === idToDelete) {
          sheet.deleteRow(i + 1);
          return ContentService.createTextOutput("OK - Filme Deletado");
        }
      }
      return ContentService.createTextOutput("NOT_FOUND");
    }

    // === DELETE AVALIAÇÃO ===
    if (action === "deleteReview") {
      var sheet = spreadsheet.getSheetByName("Avaliacoes");
      if (!sheet) return ContentService.createTextOutput("NOT_FOUND");

      var idToDelete = e.parameter.id;
      var rows = sheet.getDataRange().getValues();
      for (var i = rows.length - 1; i >= 1; i--) {
        var cellId = rows[i][0] ? rows[i][0].toString() : "";
        if (cellId === idToDelete) {
          sheet.deleteRow(i + 1);
          return ContentService.createTextOutput("OK - Avaliacao Deletada");
        }
      }
      return ContentService.createTextOutput("NOT_FOUND");
    }
    
    // === INSERT FILME ===
    if (action === "insertMovie") {
      var sheet = spreadsheet.getSheetByName("Filmes");
      if (!sheet) {
        // Cria aba se não existir
        sheet = spreadsheet.insertSheet("Filmes");
        sheet.appendRow(["ID", "Titulo", "Ano", "Genero", "Poster", "Descricao"]);
        // Formata cabeçalho
        var headerRange = sheet.getRange(1, 1, 1, 6);
        headerRange.setFontWeight("bold");
        headerRange.setBackground("#facc15");
        headerRange.setFontColor("#000000");
      }
      
      var id = e.parameter.id;
      if (!id) {
        return ContentService.createTextOutput("SKIP - Sem ID");
      }
      
      var data = [
        id,
        e.parameter.title || "",
        e.parameter.year || "",
        e.parameter.genre || "",
        e.parameter.poster || "",
        e.parameter.description || ""
      ];
      
      sheet.appendRow(data);
      Logger.log("Filme inserido: " + id);
      return ContentService.createTextOutput("OK - Filme Inserido");
    }
    
    // === INSERT AVALIAÇÃO ===
    if (action === "insertReview") {
      var sheet = spreadsheet.getSheetByName("Avaliacoes");
      if (!sheet) {
        // Cria aba se não existir
        sheet = spreadsheet.insertSheet("Avaliacoes");
        sheet.appendRow(["ID", "MovieID", "Nota", "Usuario", "Texto", "Data"]);
        // Formata cabeçalho
        var headerRange = sheet.getRange(1, 1, 1, 6);
        headerRange.setFontWeight("bold");
        headerRange.setBackground("#facc15");
        headerRange.setFontColor("#000000");
      }
      
      var id = e.parameter.id;
      if (!id) {
        return ContentService.createTextOutput("SKIP - Sem ID");
      }
      
      var data = [
        id,
        e.parameter.movieId || "",
        parseInt(e.parameter.rating) || 0,
        e.parameter.userName || "",
        e.parameter.text || "",
        e.parameter.date || ""
      ];
      
      sheet.appendRow(data);
      Logger.log("Avaliacao inserida: " + id);
      return ContentService.createTextOutput("OK - Avaliacao Inserida");
    }
    
    // === SYNC ALL (para envio em lote) ===
    if (action === "syncAll") {
      var movies = JSON.parse(e.parameter.movies || "[]");
      var reviews = JSON.parse(e.parameter.reviews || "[]");
      
      // Processa filmes
      if (movies.length > 0) {
        var sheetMovies = spreadsheet.getSheetByName("Filmes");
        if (!sheetMovies) {
          sheetMovies = spreadsheet.insertSheet("Filmes");
          sheetMovies.appendRow(["ID", "Titulo", "Ano", "Genero", "Poster", "Descricao"]);
          var headerRange = sheetMovies.getRange(1, 1, 1, 6);
          headerRange.setFontWeight("bold");
          headerRange.setBackground("#facc15");
          headerRange.setFontColor("#000000");
        }
        
        // Limpa dados antigos (mantém cabeçalho)
        var lastRow = sheetMovies.getLastRow();
        if (lastRow > 1) {
          sheetMovies.deleteRows(2, lastRow - 1);
        }
        
        // Insere novos dados
        for (var m = 0; m < movies.length; m++) {
          var movie = movies[m];
          sheetMovies.appendRow([
            movie.id,
            movie.title,
            movie.year,
            movie.genre,
            movie.poster,
            movie.description
          ]);
        }
      }
      
      // Processa avaliações
      if (reviews.length > 0) {
        var sheetReviews = spreadsheet.getSheetByName("Avaliacoes");
        if (!sheetReviews) {
          sheetReviews = spreadsheet.insertSheet("Avaliacoes");
          sheetReviews.appendRow(["ID", "MovieID", "Nota", "Usuario", "Texto", "Data"]);
          var headerRange = sheetReviews.getRange(1, 1, 1, 6);
          headerRange.setFontWeight("bold");
          headerRange.setBackground("#facc15");
          headerRange.setFontColor("#000000");
        }
        
        // Limpa dados antigos (mantém cabeçalho)
        var lastRow = sheetReviews.getLastRow();
        if (lastRow > 1) {
          sheetReviews.deleteRows(2, lastRow - 1);
        }
        
        // Insere novos dados
        for (var r = 0; r < reviews.length; r++) {
          var review = reviews[r];
          sheetReviews.appendRow([
            review.id,
            review.movieId,
            review.rating,
            review.userName,
            review.text,
            review.date
          ]);
        }
      }
      
      return ContentService.createTextOutput("OK - Sync Completo");
    }
    
    return ContentService.createTextOutput("OK - Nenhuma acao");
    
  } catch (error) {
    Logger.log("ERRO: " + error.message);
    return ContentService.createTextOutput("ERROR: " + error.message);
  }
}
