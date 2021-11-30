const express = require("express");
const { v4: uuidv4 } = require("uuid")

const app = express();

app.use(express.json())

// Todas as rotas passam pelo middleware
//app.use(verifyIfExistsAccountCPF);

const customers = []


// Midlleware

function verifyIfExistsAccountCPF(req, resp, next)
{
    const { cpf } = req.headers

    const customer = customers.find(customer => customer.cpf === cpf)

    if (!customer)
    {
        return resp.status(400).json({ error: "Customer Not Found" })
    }

    req.customer = customer;

    return next();
}

function getBalance(statement)
{
    const balance = statement.reduce(
        (acc, currentValue) =>
        {
            if (currentValue.type === "credit")
            {
                return acc + currentValue.amount;
            }
            return acc - currentValue.amount;
        }, 0);

    return balance;
}

app.post("/account", (req, resp) =>
{
    /*
        CPF = String
        Name = String
        Id = uuid
        statement = []
    */

    const { cpf, name } = req.body;

    const customerAlreadyExists = customers.some(t => t.cpf === cpf)

    if (customerAlreadyExists)
    {
        return resp.status(400).send({
            error: "Customer already exists!"
        })
    }

    customers.push({
        cpf,
        name,
        uuid: uuidv4(),
        statement: []
    })

    return resp.status(201).send()
});

app.get("/statement", verifyIfExistsAccountCPF, (req, resp) =>
{
    const { customer } = req
    return resp.json(customer.statement)
});

app.post("/deposit", verifyIfExistsAccountCPF, (req, resp) =>
{
    const { description, amount } = req.body;
    const { customer } = req;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation);

    return resp.status(201).send();
});

app.post("/withdraw", verifyIfExistsAccountCPF, (req, resp) =>
{
    const { amount } = req.body;
    const { customer } = req

    var totalAmount = getBalance(customer.statement);

    if (totalAmount < amount)
    {
        return resp.status(400).json({
            error: "Insufficient funds!"
        });
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    }

    customer.statement.push(statementOperation);

    return resp.status(201).send();
});

app.get("/statement/date", verifyIfExistsAccountCPF, (req, resp) =>
{
    const { date } = req.query;
    const { customer } = req

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter(statement =>
    {
        return statement.created_at.toDateString() ===
            new Date(dateFormat).toDateString()
    });

    return resp.json(statement)
});

app.put("/account", verifyIfExistsAccountCPF, (req, resp) =>
{
    const { name } = req.body;
    const { customer } = req

    customer.name = name;

    return resp.status(201).send();
})

app.get("/account", verifyIfExistsAccountCPF, (req, resp) =>
{
    const { customer } = req;

    return resp.json(customer);
})

app.delete("/account", verifyIfExistsAccountCPF, (req, resp) =>
{
    const { customer } = req;

    customers.splice(customer, 1);

    return resp.status(200).json(customers);
})

app.get("/balance",verifyIfExistsAccountCPF,(req,resp)=>{
    const {customer} = req

    const balance = getBalance(customer.statement)

    return resp.json(balance)
})

app.listen(3333);