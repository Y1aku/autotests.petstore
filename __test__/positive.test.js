const Chance = require('chance');
const chance = new Chance();
const request = require('supertest');
const agent = request('https://petstore.swagger.io/v2');
const path = require('path');
const fs = require('fs');

function getBody(petId) {
    return {
        "id": petId,
        "category": { "id": chance.natural(), "name": chance.word() },
        "name": chance.first(),
        "photoUrls": [ chance.url(), chance.url() ],
        "tags": [ { "id": chance.natural(), "name": chance.word() } ],
        "status": chance.pickone(['available', 'pending', 'sold'])
    };
};

let petId = chance.natural();

let requestBody = getBody(petId);


describe('Позитивный сценарий: CRUD', () => {

    let createdPet = null

    it('POST-запрос   | Добавление питомца', async () => {
        const res = await agent
        .post('/pet')
        .send(requestBody)
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(requestBody)

        createdPet = res.body

    });

    it('GET-запрос    | Поиск добавленного питомца', async () => {
        const res = await agent
        .get('/pet/' + createdPet.id)

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(createdPet)

    });

    it('PUT-запрос    | Редактирование добавленного питомца', async () => {

        const updatedRequestBody = getBody(createdPet.id);

        const res = await agent
        .put('/pet')
        .send(updatedRequestBody)
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(updatedRequestBody)

        createdPet = res.body

    });

    it('GET-запрос    | Поиск отредактированного питомца', async () => {
        const res = await agent
        .get('/pet/' + createdPet.id)

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(createdPet)

    });

    it('DELETE-запрос | Удаление отредактированного питомца', async () => {
        const res = await agent
        .delete('/pet/' + createdPet.id)
        .set('api_key', 'special-key')

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            "code": 200,
            "type": "unknown",
            "message": `${createdPet.id}`
        })

    });

    it('GET-запрос    | Поиск удаленного питомца', async () => {
        const res = await agent
        .get('/pet/' + createdPet.id)

        expect(res.statusCode).toBe(404);
        expect(res.body).toEqual({
            "code": 1,
            "type": "error",
            "message": "Pet not found"
        });

    });

});


describe('Позитивный сценарий: Добавление фото питомцу', () => {

    let createdPet = null

    it('POST-запрос   | Добавление питомца', async () => {
        const res = await agent
        .post('/pet')
        .send(requestBody)
        
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(requestBody);

        createdPet = res.body

    });

    
    it('POST-запрос   | Загрузка фото питомца', async () => {
        const filePath = path.join(__dirname, './testdata/Puppy.jpeg');;
        const stats = fs.statSync(filePath);
        const fileSizeInBytes = stats.size;

        const fileName = 'Puppy.jpeg';

        const additionalMetadataValue = chance.word();

        const res = await agent
        .post('/pet/' + createdPet.id + '/uploadImage')
        .field('additionalMetadata', additionalMetadataValue)
        .attach('file', path.resolve(__dirname, './testdata/'+ fileName))

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            code: 200,
            type: 'unknown',
            message: `additionalMetadata: ${additionalMetadataValue}\nFile uploaded to ./${fileName}, ${fileSizeInBytes} bytes`
        });

    });

});


describe('Позитивный сценарий: Поиск по статусу', () => {

    it('GET-запрос    | Поиск питомца по статусу', async () => {
        const res = await agent
        .get('/pet/findByStatus?status=' + 'sold')

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                status: 'sold',
              }),
            ])
          );
          expect(res.body).not.toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    status: 'pending',
                }),
                expect.objectContaining({
                    status: 'available',
              }),
            ])
        );

    });

});
